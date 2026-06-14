/**
 * Site content. Edit this file to change page text, links, music and cards;
 * no markup changes are needed — render.js builds the DOM from here.
 */
window.YK = window.YK || {};

window.YK.data = {
  avatar: 'https://q1.qlogo.cn/g?b=qq&nk=1303028790&s=640',
  audio: 'assets/music/shikong-manbu.mp3',

  // Intro lines shown next to the avatar (one <p> per entry)
  info: [
    '欢迎来到我的世界, 这里没有神, 只有我构筑的代码、记忆和光',
    '——Sakurine',
  ],

  // Accordion social buttons; `brand` tints the icon and label on hover
  links: [
    { label: 'QQGroup', icon: 'assets/icons/qq-line.svg',       brand: '#12b7f5', target: '_blank', href: 'https://qm.qq.com/cgi-bin/qm/qr?k=O6KD1bt5WDvQw47kzjaDuYIASzar_y-F&jump_from=webapi&authKey=AnF+0ddOwtFY4laf9lDJ9Om7tj5oZE2dfuHJlQfOO2CXaeTOOVdJxlxIg9wSs4WQ' },
    { label: 'Twitter',  icon: 'assets/icons/twitter-line.svg',  brand: '#000000', target: '_blank', href: 'https://x.com/Yosa04942475621' },
    { label: 'BiliBili', icon: 'assets/icons/bilibili-line.svg', brand: '#fb7299', target: '_blank', href: 'https://space.bilibili.com/433677987' },
    { label: 'GitHub',   icon: 'assets/icons/github-line.svg',   brand: '#333333', target: '_blank', href: 'https://github.com/Yueosa' },
    { label: 'Gmail',    icon: 'assets/icons/mail-line.svg',     brand: '#d93025', target: '_self',  href: 'mailto:yichengxin7@gmail.com' },
  ],

  // Projects carousel (GitHub repos)
  projects: {
    title: 'Projects',
    subtitle: '如你所见, 这些是我亲手写下的东西',
    cta: '前往',
    ctaIcon: 'ri-github-fill',
    cards: [
      { tag: 'Yueosa / YukiLog',           name: 'YukiLog',           desc: '全栈博客源码',                 href: 'https://github.com/Yueosa/YukiLog',           image: 'assets/photo/projects/yukilog.webp' },
      { tag: 'Yueosa / LianBot',           name: 'LianBot',           desc: '自己群里部署的 QQ 机器人',     href: 'https://github.com/Yueosa/LianBot',           image: 'assets/photo/projects/lianbot.webp' },
      { tag: 'Yueosa / lianwall',          name: 'lianwall',          desc: '自己写的壁纸管理软件',         href: 'https://github.com/Yueosa/lianwall',          image: 'assets/photo/projects/lianwall.webp' },
      { tag: 'Yueosa / lianpkg',           name: 'lianpkg',           desc: '自己写的 wallpaper 壁纸提取软件', href: 'https://github.com/Yueosa/lianpkg',         image: 'assets/photo/projects/lianpkg.webp' },
      { tag: 'Yueosa / Yukikoi-Sakurine',  name: 'Yukikoi-Sakurine',  desc: '这个主页的源码',               href: 'https://github.com/Yueosa/Yukikoi-Sakurine',  image: 'assets/photo/projects/sakurine.webp' },
      { tag: 'Yueosa / .lian',             name: '.lian',             desc: '我的 Arch Linux 配置文件',     href: 'https://github.com/Yueosa/.lian',             image: 'assets/photo/projects/lian.webp' },
      { tag: 'Yueosa / alive',             name: 'alive',             desc: '视奸系统的源码',               href: 'https://github.com/Yueosa/alive',             image: 'assets/photo/projects/alive.webp' },
    ],
  },

  // Wander carousel (live sites)
  wander: {
    title: 'Wander',
    subtitle: '在恋构筑的这些小世界之间漫步',
    cta: '前往',
    ctaIcon: 'ri-arrow-right-up-line',
    cards: [
      { tag: 'ever.yeastar.xin',    name: 'ever',  desc: '一个简单的留言板应用',             href: 'https://ever.yeastar.xin',     image: 'assets/photo/wander/ever.webp' },
      { tag: 'blog.yeastar.xin',    name: 'blog',  desc: '恋的博客, 写了很多有趣的东西哦',   href: 'https://blog.yeastar.xin/',    image: 'assets/photo/wander/blog.webp' },
      { tag: 'alive.yeastar.xin',   name: 'alive', desc: '视奸~ 来看看恋在做什么吧!',        href: 'https://alive.yeastar.xin/',   image: 'assets/photo/wander/alive.webp' },
      { tag: 'list.yeastar.xin',    name: 'list',  desc: '恋的网盘~ 也许存了一些色色的东西!', href: 'https://list.yeastar.xin/',   image: 'assets/photo/wander/list.webp' },
      { tag: 'iamhere.yeastar.xin', name: 'self',  desc: '这是恋的遗书~ 留给世界最后的东西!', href: 'https://iamhere.yeastar.xin/', image: 'assets/photo/wander/self.webp' },
    ],
  },
};
