# Yukikoi-Sakurine

Sakurine 的个人主页，纯静态 HTML+CSS+JS，无任何后端依赖。

## 结构

```
Yukikoi/
├── index.html
├── favicon.ico
├── css/style.css
├── js/main.js
├── assets/
│   ├── avatar/avatar_Sakurine.jpg
│   ├── photo/          # 个人照片（自行放置）
│   ├── icons/          # SVG 图标备用
│   └── music/mainmusic.m4a
└── deploy.sh
```

## 页面

- **Prologue** — 默认页，头像 + 简介 + 社交按钮
- **AsYouSeeMe** — 照片 + 个人信息
- **BeginUs** — 站点导航卡片

## 部署

```bash
./deploy.sh
```

将文件同步到 `/var/www/yukikoi`，需要 rsync 和对应目录的写权限。
