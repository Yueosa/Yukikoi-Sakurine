# Yukikoi-Sakurine

Sakurine 的个人主页，纯静态 HTML+CSS+JS，无任何后端依赖，可直接以 `file://` 打开。

## 结构

```
Yukikoi/
├── index.html          # 空容器骨架，内容由 config 渲染
├── css/
│   ├── base.css        # 变量、reset、body
│   ├── loader.css      # 加载页与心电图
│   ├── layout.css      # 背景、导航、箭头、面板切换与入场动画
│   ├── prologue.css    # 头像、简介、社交按钮
│   └── cards.css       # 轮播卡片（Projects/Wander 共用）
├── js/
│   ├── config.js       # 站点内容（文本、链接、音乐、卡片）
│   ├── render.js       # 由 config 构建 DOM
│   ├── loader.js       # 加载页心电图时序
│   ├── navigation.js   # 面板切换、导航、箭头
│   ├── carousel.js     # requestAnimationFrame 无限轮播
│   └── main.js         # 引导装配与音乐门控
├── assets/
│   ├── photo/projects/ # 项目卡片配图
│   ├── photo/wander/   # 站点卡片配图
│   ├── icons/          # SVG 社交图标
│   └── music/          # 背景音乐
└── deploy.sh
```

## 页面

- **Prologue** — 默认页，头像 + 简介 + 社交按钮
- **Projects** — GitHub 项目横向轮播卡片
- **Wander** — 站点导航横向轮播卡片

## 编辑内容

所有文本、链接、音乐和卡片都集中在 [js/config.js](js/config.js)，改内容只需编辑该文件，无需改动 HTML。

## 部署

```bash
./deploy.sh
```

将文件同步到 `/var/www/yukikoi`，需要 rsync 和对应目录的写权限。
