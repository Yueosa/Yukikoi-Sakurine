#!/usr/bin/env bash
# Yukikoi server manager — Ubuntu Server 20.04+
# Usage: sudo bash deploy.sh [menu|install|update|status|nginx|certificate]
#        bash deploy.sh release Vx.x.x

set -Eeuo pipefail

readonly DEST="/var/www/yukikoi"
readonly ENV_FILE="$DEST/.env"
readonly NGINX_NAME="yukikoi.conf"
readonly NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_NAME"
readonly NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_NAME"
readonly DEFAULT_REPO="https://github.com/Yueosa/Yukikoi-Sakurine.git"
readonly DEFAULT_BRANCH="main"

C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'; C_NC=$'\033[0m'

info() { printf '%s[+]%s %s\n' "$C_GREEN" "$C_NC" "$*"; }
warn() { printf '%s[!]%s %s\n' "$C_YELLOW" "$C_NC" "$*" >&2; }
die() { printf '%s[x]%s %s\n' "$C_RED" "$C_NC" "$*" >&2; exit 1; }
pause() { read -rp "  按 Enter 返回..." _; }
title() { printf '\n%s%s%s\n' "$C_BOLD" "$*" "$C_NC"; }
sep() { printf '%s\n' "────────────────────────────────────────────────────────"; }

trap 'die "第 $LINENO 行执行失败"' ERR

require_root() {
    [[ $EUID -eq 0 ]] || die "请使用 sudo bash deploy.sh 运行"
}

valid_domain() {
    [[ "$1" =~ ^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$ ]]
}

load_env() {
    DOMAIN=""; WWW_DOMAIN=""; EMAIL=""
    REPO_URL="$DEFAULT_REPO"; BRANCH="$DEFAULT_BRANCH"; INSTALLED_VERSION=""
    if [[ -f "$ENV_FILE" ]]; then
        # This file is generated locally with shell-escaped values and is root-only.
        # shellcheck disable=SC1090
        source "$ENV_FILE"
    fi
}

save_env() {
    install -d -m 755 "$DEST"
    local tmp
    tmp="$(mktemp)"
    {
        printf 'DOMAIN=%q\n' "$DOMAIN"
        printf 'WWW_DOMAIN=%q\n' "$WWW_DOMAIN"
        printf 'EMAIL=%q\n' "$EMAIL"
        printf 'REPO_URL=%q\n' "$REPO_URL"
        printf 'BRANCH=%q\n' "$BRANCH"
        printf 'INSTALLED_VERSION=%q\n' "$INSTALLED_VERSION"
    } > "$tmp"
    install -m 600 "$tmp" "$ENV_FILE"
    rm -f "$tmp"
}

configure() {
    load_env
    local value
    read -rp "主域名 [${DOMAIN:-yeastar.xin}]: " value
    DOMAIN="${value:-${DOMAIN:-yeastar.xin}}"
    valid_domain "$DOMAIN" || die "域名格式无效：$DOMAIN"
    WWW_DOMAIN="www.$DOMAIN"

    read -rp "Certbot 邮箱 [${EMAIL:-}]: " value
    EMAIL="${value:-$EMAIL}"
    [[ "$EMAIL" == *@*.* ]] || die "请输入可用的证书通知邮箱"

    read -rp "Git 仓库 [$REPO_URL]: " value
    REPO_URL="${value:-$REPO_URL}"
    read -rp "分支 [$BRANCH]: " value
    BRANCH="${value:-$BRANCH}"
    save_env
    info "已保存 $DOMAIN 与 $WWW_DOMAIN 到 $ENV_FILE"
}

ensure_config() {
    load_env
    if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
        warn "尚未完成站点配置"
        configure
        load_env
    fi
}

install_dependencies() {
    local missing=()
    for command in nginx certbot git rsync curl sha256sum openssl; do
        command -v "$command" &>/dev/null || missing+=("$command")
    done
    ((${#missing[@]} == 0)) && return
    info "安装 nginx、certbot、git、rsync 等依赖"
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        nginx certbot python3-certbot-nginx git rsync curl ca-certificates openssl
}

version_field() {
    local file="$1" field="$2"
    awk -F= -v key="$field" '$1 == key { sub(/^[^=]*=/, ""); gsub(/\r/, ""); print; exit }' "$file"
}

payload_hash() {
    local root="$1"
    (
        cd "$root"
        find index.html css js assets -type f -print0 \
            | LC_ALL=C sort -z \
            | xargs -0 sha256sum \
            | sha256sum \
            | awk '{print $1}'
    )
}

verify_source() {
    local source="$1"
    local metadata="$source/.version"
    [[ -f "$metadata" ]] || die "仓库缺少 .version"
    local expected actual version
    version="$(version_field "$metadata" version)"
    expected="$(version_field "$metadata" hash)"
    [[ "$version" =~ ^V[0-9]+\.[0-9]+\.[0-9]+$ ]] || die ".version 中的版本号无效"
    [[ "$expected" =~ ^[a-f0-9]{64}$ ]] || die ".version 中的 SHA-256 无效"
    actual="$(payload_hash "$source")"
    [[ "$actual" == "$expected" ]] || die "完整性校验失败：期望 $expected，实际 $actual"
    printf '%s' "$version"
}

clone_release() {
    local target="$1"
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$target"
}

sync_site() {
    local source="$1"
    install -d -m 755 "$DEST"
    rsync -a --delete \
        --exclude '.git/' \
        --exclude '.gitignore' \
        --exclude '.env' \
        --exclude 'README.md' \
        --exclude 'scripts/' \
        --exclude 'test/' \
        "$source/" "$DEST/"
    chown -R www-data:www-data "$DEST"
    chown root:root "$DEST/deploy.sh"
    chmod 755 "$DEST/deploy.sh"
    chown root:root "$ENV_FILE"
    chmod 600 "$ENV_FILE"
}

certificate_exists() {
    [[ -s "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
        && -s "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ]]
}

warn_duplicate_server_name() {
    local hit=""
    if [[ -d /etc/nginx/sites-enabled ]]; then
        hit="$(grep -RlsE "server_name[[:space:]][^;]*${DOMAIN//./\\.}" \
            /etc/nginx/sites-enabled 2>/dev/null | grep -vFx "$NGINX_ENABLED" || true)"
    fi
    [[ -z "$hit" ]] || warn "其他配置也声明了 $DOMAIN：$hit"
}

write_nginx_config() {
    ensure_config
    warn_duplicate_server_name
    local tmp
    tmp="$(mktemp)"

    if certificate_exists; then
        cat > "$tmp" <<EOF
# Generated by Yukikoi deploy.sh. This file belongs only to this site.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;

    location ^~ /.well-known/acme-challenge/ {
        root $DEST;
    }
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;
    root $DEST;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:YukikoiSSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    location = /index.html {
        add_header Cache-Control "no-cache";
    }
    location = / {
        try_files /index.html =404;
        add_header Cache-Control "no-cache";
    }
    location ~* \.(?:css|js)$ {
        try_files \$uri =404;
        expires 7d;
        add_header Cache-Control "public";
    }
    location ~* \.(?:webp|mp4|png|jpe?g|svg|ico)$ {
        try_files \$uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF
    else
        cat > "$tmp" <<EOF
# Temporary HTTP configuration; HTTPS is added after certificate issuance.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    root $DEST;
    index index.html;

    location ^~ /.well-known/acme-challenge/ {
        root $DEST;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
    fi

    install -m 644 "$tmp" "$NGINX_AVAILABLE"
    rm -f "$tmp"
    ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    nginx -t
    systemctl enable --now nginx
    systemctl reload nginx
    info "nginx 配置已生成：$NGINX_AVAILABLE"
}

issue_certificate() {
    ensure_config
    write_nginx_config
    if certificate_exists; then
        info "$DOMAIN 的证书已经存在"
        return
    fi
    info "为 $DOMAIN 与 $WWW_DOMAIN 申请证书"
    certbot certonly --webroot -w "$DEST" \
        --cert-name "$DOMAIN" -d "$DOMAIN" -d "$WWW_DOMAIN" \
        --non-interactive --agree-tos --email "$EMAIL"
    write_nginx_config
}

renew_certificate() {
    ensure_config
    certbot renew --cert-name "$DOMAIN"
    write_nginx_config
}

remote_version_file() {
    local output="$1"
    if [[ "$REPO_URL" == *github.com/Yueosa/Yukikoi-Sakurine* ]]; then
        # raw.githubusercontent.com 的分支路径会被 CDN 缓存旧内容，走 API 拿实时文件
        curl -fsSL -H "Accept: application/vnd.github.raw" \
            "https://api.github.com/repos/Yueosa/Yukikoi-Sakurine/contents/.version?ref=$BRANCH" -o "$output"
    else
        local tmp
        tmp="$(mktemp -d)"
        clone_release "$tmp/repo"
        cp "$tmp/repo/.version" "$output"
        rm -rf "$tmp"
    fi
}

install_site() {
    require_root
    install_dependencies
    ensure_config
    local tmp version
    tmp="$(mktemp -d)"
    clone_release "$tmp/repo"
    version="$(verify_source "$tmp/repo")"
    sync_site "$tmp/repo"
    INSTALLED_VERSION="$version"
    save_env
    write_nginx_config
    issue_certificate
    rm -rf "$tmp"
    info "Yukikoi $version 已部署到 https://$DOMAIN"
}

update_site() {
    require_root
    install_dependencies
    ensure_config
    local tmp remote current
    tmp="$(mktemp -d)"
    remote_version_file "$tmp/.version"
    remote="$(version_field "$tmp/.version" version)"
    current="${INSTALLED_VERSION:-未记录}"

    title "版本检查"
    printf '  当前版本：%s\n  远端版本：%s\n\n' "$current" "$remote"
    [[ "$remote" != "$current" ]] || { info "已经是最新版本"; rm -rf "$tmp"; return; }
    read -rp "第一次确认：下载并校验 $remote？(y/N): " answer
    [[ "${answer,,}" == y ]] || { info "已取消"; rm -rf "$tmp"; return; }

    clone_release "$tmp/repo"
    [[ "$(verify_source "$tmp/repo")" == "$remote" ]] || die "远端元数据前后不一致"
    read -rp "第二次确认：替换当前站点文件？(输入版本号 $remote): " answer
    [[ "$answer" == "$remote" ]] || { info "已取消"; rm -rf "$tmp"; return; }

    sync_site "$tmp/repo"
    INSTALLED_VERSION="$remote"
    save_env
    nginx -t && systemctl reload nginx
    rm -rf "$tmp"
    info "已更新到 $remote"
}

status() {
    load_env
    title "Yukikoi 部署状态"
    sep
    printf '  目录        %s\n' "$DEST"
    printf '  域名        %s\n' "${DOMAIN:-未配置}"
    printf '  www         %s\n' "${WWW_DOMAIN:-未配置}"
    printf '  版本        %s\n' "${INSTALLED_VERSION:-未记录}"
    printf '  nginx       %s\n' "$(systemctl is-active nginx 2>/dev/null || true)"
    printf '  配置检查    '
    nginx -t &>/dev/null && printf '%s通过%s\n' "$C_GREEN" "$C_NC" || printf '%s失败%s\n' "$C_RED" "$C_NC"
    if [[ -n "$DOMAIN" ]] && certificate_exists; then
        printf '  证书到期    '
        openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -enddate | cut -d= -f2
        printf '  HTTPS       '
        curl -kfsS --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" -o /dev/null \
            && printf '%s可用%s\n' "$C_GREEN" "$C_NC" \
            || printf '%s不可用%s\n' "$C_RED" "$C_NC"
    else
        printf '  证书        未签发\n'
    fi
    sep
}

write_release_metadata() {
    local version="${1:-}"
    [[ "$version" =~ ^V[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "用法：bash deploy.sh release Vx.x.x"
    [[ -f index.html && -d css && -d js && -d assets ]] || die "请在仓库根目录运行 release"
    local hash now tmp
    hash="$(payload_hash "$PWD")"
    now="$(date +%s)"
    tmp="$(mktemp)"
    printf 'version=%s\nhash=%s\ntime=%s\n' "$version" "$hash" "$now" > "$tmp"
    mv "$tmp" .version
    info "已生成 .version：$version"
    printf '  hash: %s\n  time: %s\n' "$hash" "$now"
}

main_menu() {
    require_root
    while true; do
        # ANSI clear works even when the SSH client's TERM entry is absent remotely.
        printf '\033[2J\033[H'
        load_env
        title "Yukikoi ${INSTALLED_VERSION:-未安装} — 管理面板"
        sep
        printf '\n  域名：%s\n\n' "${DOMAIN:-未配置}"
        echo "  1  一键安装 / 重新部署"
        echo "  2  检查并更新版本"
        echo "  3  查看部署状态"
        echo "  4  配置域名、邮箱与仓库"
        echo "  5  检查并重新生成 nginx 配置"
        echo "  6  检查 / 申请 SSL 证书"
        echo "  7  一键续签证书"
        echo ""
        echo "  0  退出"
        echo ""
        read -rp "  > " choice
        case "$choice" in
            1) install_site; pause ;;
            2) update_site; pause ;;
            3) status; pause ;;
            4) configure; pause ;;
            5) write_nginx_config; pause ;;
            6) issue_certificate; pause ;;
            7) renew_certificate; pause ;;
            0) exit 0 ;;
            *) warn "请输入 0-7"; sleep 0.5 ;;
        esac
    done
}

case "${1:-menu}" in
    menu) main_menu ;;
    install) install_site ;;
    update) update_site ;;
    status) require_root; status ;;
    configure) require_root; configure ;;
    nginx) require_root; write_nginx_config ;;
    certificate) require_root; issue_certificate ;;
    renew) require_root; renew_certificate ;;
    release) write_release_metadata "${2:-}" ;;
    *) die "用法：sudo bash deploy.sh [menu|install|update|status|configure|nginx|certificate|renew]；或 bash deploy.sh release Vx.x.x" ;;
esac
