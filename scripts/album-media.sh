#!/usr/bin/env bash
# album-media.sh — 把相册原始素材转换为网页使用的媒体文件
#
# 用法：bash scripts/album-media.sh <源目录> [输出目录]
#
#   <源目录>/photos/photo-NN.*      →  thumb/photo-NN.webp（宽 640）+ full/photo-NN.webp（长边 ≤ 2048）
#   <源目录>/videos/video-NAME.mp4  →  film/NAME.mp4（H.264 + faststart）+ thumb/film-NAME.webp（封面帧）
#
# 输出会移除 EXIF、GPS、设备标签和 ICC；广色域照片先转换到 sRGB，静音音轨直接丢弃。
# 输出目录默认是仓库内的 assets/album/。

set -euo pipefail

usage() {
    echo "用法: bash $0 <源目录> [输出目录]"
    echo "  源目录需要包含 photos/ 与 videos/ 子目录"
}

SRC="${1:-}"
[[ -n "$SRC" && -d "$SRC" ]] || { usage; exit 1; }
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${2:-$ROOT/assets/album}"

THUMB_WIDTH=640
FULL_EDGE=2048
THUMB_QUALITY=70
PHOTO_QUALITY=80
GRAPHIC_QUALITY=86
VIDEO_CRF=26
SILENCE_DB=-45

# 单个视频的覆盖参数：封面帧时间（秒，默认取时长的 20%）与 CRF
declare -A POSTER_AT=([cat]=3.3 [desktop]=56 [mc]=7 [miao]=1.3)
declare -A FILM_CRF=([desktop]=28)

for cmd in vips vipsheader ffmpeg ffprobe; do
    command -v "$cmd" &>/dev/null || { echo "缺少依赖: $cmd"; exit 1; }
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT/thumb" "$OUT/full" "$OUT/film"
shopt -s nullglob

# to_webp <输入> <输出> <最大宽> <最大高> <质量>
to_webp() {
    vips thumbnail "$1" "$2[Q=$5,effort=6,smart_subsample=true,keep=none]" "$3" \
        --height "$4" --size down --export-profile srgb --intent perceptual
}

# privacy_source <照片名> <输入>：对公开版本做不可逆像素化，原始素材保持不变
privacy_source() {
    local name="$1" src="$2" dst="$TMP/$name.png"
    case "$name" in
        photo-08)
            ffmpeg -hide_banner -loglevel error -y -i "$src" -filter_complex \
                "[0:v]split[base][detail];[detail]crop=120:120:1150:20,scale=3:3,scale=120:120:flags=neighbor[pixel];[base][pixel]overlay=1150:20" \
                -frames:v 1 "$dst"
            echo "$dst"
            ;;
        photo-19)
            ffmpeg -hide_banner -loglevel error -y -i "$src" -filter_complex \
                "[0:v]split[base][detail];[detail]crop=300:110:350:970,scale=5:2,scale=300:110:flags=neighbor[pixel];[base][pixel]overlay=350:970" \
                -frames:v 1 "$dst"
            echo "$dst"
            ;;
        *) echo "$src" ;;
    esac
}

# audio_args <视频>：有声音轨转 AAC（≤128k），静音或无音轨时丢弃
audio_args() {
    local src="$1" peak bitrate
    if [[ -z "$(ffprobe -v error -select_streams a:0 -show_entries stream=index -of csv=p=0 "$src")" ]]; then
        echo "-an"
        return
    fi
    peak="$(ffmpeg -hide_banner -nostats -i "$src" -map 0:a:0 -af volumedetect -f null - 2>&1 \
        | sed -n 's/.*max_volume: \(-\{0,1\}[0-9.]*\) dB.*/\1/p')"
    if ! awk -v peak="${peak:--999}" -v floor="$SILENCE_DB" 'BEGIN { exit !(peak > floor) }'; then
        echo "-an"
        return
    fi
    bitrate="$(ffprobe -v error -select_streams a:0 -show_entries stream=bit_rate -of csv=p=0 "$src")"
    [[ "$bitrate" =~ ^[0-9]+$ ]] && (( bitrate <= 128000 )) || bitrate=128000
    echo "-map 0:a:0 -c:a aac -b:a $bitrate -ac 2"
}

for src in "$SRC"/photos/photo-*.*; do
    name="$(basename "${src%.*}")"
    public_src="$(privacy_source "$name" "$src")"
    quality=$GRAPHIC_QUALITY
    [[ "$(vipsheader -f vips-loader "$src")" == jpegload ]] && quality=$PHOTO_QUALITY
    to_webp "$public_src" "$OUT/thumb/$name.webp" "$THUMB_WIDTH" 100000 "$THUMB_QUALITY"
    to_webp "$public_src" "$OUT/full/$name.webp" "$FULL_EDGE" "$FULL_EDGE" "$quality"
    echo "  photo  $name"
done

for src in "$SRC"/videos/video-*.mp4; do
    name="$(basename "$src" .mp4)"
    name="${name#video-}"
    read -ra audio <<< "$(audio_args "$src")"
    ffmpeg -hide_banner -loglevel error -y -i "$src" -map 0:v:0 "${audio[@]}" \
        -map_metadata -1 -map_chapters -1 \
        -c:v libx264 -preset slow -crf "${FILM_CRF[$name]:-$VIDEO_CRF}" -profile:v high -pix_fmt yuv420p \
        -movflags +faststart "$OUT/film/$name.mp4"

    duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")"
    at="${POSTER_AT[$name]:-$(awk -v d="$duration" 'BEGIN { printf "%.2f", d * .20 }')}"
    ffmpeg -hide_banner -loglevel error -y -ss "$at" -i "$src" -frames:v 1 "$TMP/$name.png"
    to_webp "$TMP/$name.png" "$OUT/thumb/film-$name.webp" "$THUMB_WIDTH" 100000 "$THUMB_QUALITY"
    echo "  film   $name"
done

echo
echo "缩略图尺寸（写入 index.html 的 width / height）："
for thumb in "$OUT"/thumb/*.webp; do
    printf '  %-20s %s×%s\n' "$(basename "$thumb")" "$(vipsheader -f width "$thumb")" "$(vipsheader -f height "$thumb")"
done
