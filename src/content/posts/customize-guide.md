---
title: "自定义你的 Sakura 博客"
description: "从零开始配置 Sakura 主题：修改站点信息、更换封面、配置功能模块。"
date: 2026-05-16
category: "教程"
cover: "/images/random/d-6.jpg"
---

本文教你如何自定义 Sakura 主题，让它真正成为你的博客。

## 1. 修改站点信息

编辑 `src/data/site.json`：

```json
{
  "name": "你的博客名",
  "description": "博客描述",
  "author": "你的名字",
  "author_description": "一句话介绍自己",
  "avatar": "/images/avatars/avatar.png",
  "logo": "/images/brand/logo.png"
}
```

将 `avatar.png` 和 `logo.png` 替换为你自己的图片，分别放在 `public/images/avatars/` 和 `public/images/brand/` 目录下。

## 2. 配置导航

在 `site.json` 中修改 `nav_links`：

```json
"nav_links": [
  { "label": "首页", "url": "/" },
  { "label": "归档", "url": "/archive" },
  { "label": "友链", "url": "/links" },
  { "label": "关于", "url": "/about" }
]
```

## 3. 设置精选文章

首页顶部的"聚焦"区域通过 `featured_posts` 配置：

```json
"featured_posts": [
  {
    "title": "文章标题",
    "link": "/posts/your-post",
    "img": "/images/random/d-3.jpg"
  }
]
```

可以配置 1 到 3 篇精选文章。

## 4. 音乐播放器

通过 `aplayer` 配置 Netease 云音乐播放：

```json
"aplayer": {
  "enabled": true,
  "server": "netease",
  "playlist_id": "你的歌单ID",
  "fixed": true,
  "theme": "#E67474"
}
```

`playlist_id` 可以在 Netease 云音乐的歌单 URL 中找到。

## 5. 公告栏

```json
"notice": {
  "enabled": true,
  "text": "欢迎来访！这是公告内容。"
}
```

公告栏会显示在首页顶部。

## 6. 创建新文章

在 `src/content/posts/` 下创建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "文章摘要"
date: 2024-05-01
category: "分类"
cover: "/images/random/d-5.jpg"
draft: false
sticky: false
---

文章正文内容...
```

## 7. 封面默认图

```json
"cover": {
  "enabled": true,
  "default_image": "/images/random/d-1.jpg"
}
```

没有设置封面的文章将使用这张默认图。

## 8. 暗色模式

```json
"dark_mode": {
  "enabled": true,
  "auto_start": 22,
  "auto_end": 7
}
```

每晚 22:00 自动切换暗色模式，早晨 7:00 恢复。

---

现在你已经可以完全自定义你的 Sakura 博客了。有问题欢迎提 Issue。
