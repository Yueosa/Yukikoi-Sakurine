# Yukikoi-Sakurine

恋 / Sakurine 的个人站点。纯静态 HTML + CSS + JS，没有构建步骤和后端依赖，可以直接用 `file://` 打开。

HTML 只负责内容与结构，CSS 负责视觉和全部动画编排，JS 只负责行为与状态切换。

## 结构

```
Yukikoi/
├── .version                # 发布版本、站点内容 SHA-256、发布时间
├── index.html              # 全部内容：开屏、首页、相册条目、预览弹窗
├── css/
│   ├── base.css            # 设计变量、reset、全局元素、滚动锁定状态
│   ├── prelude.css         # 开屏：蓝色静线 → 一次心跳 → 模糊交接（时间轴只在这里）
│   ├── masthead.css        # 顶栏：阅读进度、站名、导航
│   ├── cover.css           # 首屏：LIAN / 恋、头像引语、脉冲海报、社交账号
│   ├── sections.css        # 项目、短文、其他站点、页脚
│   ├── album.css           # 左侧相册空间与媒体卡片
│   ├── viewer.css          # 媒体预览弹窗
│   └── motion.css          # 入场、滚动揭示、减少动态效果
├── js/
│   ├── boot.js             # <head> 内同步执行：标记 JS 可用，刷新总是回到顶部
│   ├── core.js             # window.YK 命名空间与工具函数
│   ├── prelude.js          # 等待开屏退出动画开始，把页面交给主页
│   ├── pulse.js            # 右上角心电图：程序化生成波形 + 显式状态机
│   ├── progress.js         # 顶栏阅读进度
│   ├── reveal.js           # 区块首次进入视口时揭示
│   ├── viewer.js           # <dialog> 预览：先显示缩略图，原图解码后替换
│   ├── album.js            # 相册开合、焦点管理、历史记录
│   └── main.js             # 装配各模块，切换标签页标题
├── assets/album/
│   ├── thumb/              # 卡片缩略图与视频封面（WebP，宽 640）
│   ├── full/               # 预览原图（WebP，长边 ≤ 2048）
│   └── film/               # 视频（H.264，faststart）
├── scripts/album-media.sh  # 原始素材 → 网页媒体
└── deploy.sh
```

## 编辑内容

所有文字和链接都直接写在 `index.html` 里。JS 通过 `data-*` 属性找到需要交互的元素，CSS 只使用 class，所以改文字或调整结构时互不影响。

### 修改样式或脚本

`index.html` 引用的每个 CSS / JS 都带有 `?v=版本号`。改动这些文件后，把所有 `?v=` 一起改成新版本（例如 `2.0.0` → `2.0.1`），否则访客的浏览器可能继续使用缓存里的旧文件。

### 添加相册条目

1. 把照片命名为 `photo-NN.*`、视频命名为 `video-NAME.mp4`，分别放进同一个源目录的 `photos/` 与 `videos/`
2. 运行 `bash scripts/album-media.sh <源目录>`（需要 libvips 与 ffmpeg）。脚本会移除 EXIF、GPS 和设备信息，把广色域照片转换到 sRGB，并在最后输出每张缩略图的宽高
3. 在 `index.html` 的 `data-album-grid` 列表里复制一个 `<li>`，填入路径、缩略图宽高、标题和分类。视频使用 `data-kind="film"`，想要更重的投影就加上 `media-card--featured`

编号和照片 / 视频数量会自动计算。

## 部署

Ubuntu Server 20.04 或更高版本可以直接从 GitHub 启动安装：

```bash
curl -fsSL https://raw.githubusercontent.com/Yueosa/Yukikoi-Sakurine/main/deploy.sh \
  -o /tmp/yukikoi-deploy.sh
sudo bash /tmp/yukikoi-deploy.sh install
```

安装向导会询问主域名、Certbot 邮箱、仓库地址和分支。输入主域名（例如 `yeastar.xin`）后会同时配置 `yeastar.xin` 与 `www.yeastar.xin`。请先让这两个 DNS 记录都指向服务器。

配置保存在 `/var/www/yukikoi/.env`，权限为 `600`。完整同步会保留它。nginx 只使用独立的 `/etc/nginx/sites-available/yukikoi.conf`，不会删除或改写其他站点配置。

日常管理运行：

```bash
sudo bash /var/www/yukikoi/deploy.sh
```

如果服务器目录里没有管理脚本，也可以在仓库目录运行 `sudo bash deploy.sh`。菜单提供版本检查与双重确认更新、nginx 检查和重建、证书检查、申请与续签。

发布新版前需要同步更新 `.version`：

- `version`：`Vx.x.x`
- `hash`：`index.html`、`css/`、`js/`、`assets/` 的确定性 SHA-256
- `time`：Unix 时间戳

不要手工计算，运行：

```bash
bash deploy.sh release V2.0.2
```
