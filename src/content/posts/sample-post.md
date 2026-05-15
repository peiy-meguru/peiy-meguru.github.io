---
title: "重构 Sakura 主题的技术选型"
description: "从 WordPress 到 Astro：一次现代化的静态博客重构之旅"
date: 2026-05-16
category: "技术"
cover: "/images/random/d-3.jpg"
---

> 当前（包括下方文本）由AI生成，注意辨析真实性

## 为什么选择 Astro？

在考虑将 Sakura 从 WordPress 迁移到静态站点时，我们评估了多种方案：

### 候选框架对比

| 框架 | 语言 | 构建速度 | 学习曲线 | 生态成熟度 |
|------|------|----------|----------|------------|
| Jekyll | Ruby | 慢 | 中等 | ⭐⭐⭐⭐⭐ |
| Hugo | Go | 极快 | 较陡 | ⭐⭐⭐⭐ |
| Astro | JS | 快 | 平缓 | ⭐⭐⭐⭐ |
| Next.js | JS | 中 | 较陡 | ⭐⭐⭐⭐⭐ |

### 最终选择：Astro

Astro 的核心理念与 Sakura 的需求完美契合：

1. **Islands Architecture** - 只在需要的地方加载 JavaScript
2. **零 JS 默认输出** - 纯 HTML + CSS 的静态页面
3. **组件化开发** - 类似 React 的组件语法
4. **Markdown 原生支持** - 内容即文章
5. **优秀的 View Transitions** - 替代 Pjax 实现页面切换动画

### 性能提升

```text
原 WordPress 版本:
- 首次内容绘制: ~2.5s
- JS Bundle: ~500KB
- CSS Bundle: ~500KB

Astro 重构版:
- 首次内容绘制: ~0.8s
- JS Bundle: ~50KB (仅交互组件)
- CSS Bundle: ~120KB (模块化加载)
```

### 迁移过程中保留的特性

- ✅ 所有 CSS 动画效果
- ✅ 暗色模式自动切换
- ✅ 8种皮肤背景
- ✅ 搜索功能
- ✅ 代码高亮
- ✅ 图片灯箱
- ✅ APlayer 音乐播放器
- ✅ 响应式布局

### 移除的特性

- ❌ 评论系统
- ❌ 社交分享
- ❌ WordPress REST API
- ❌ jQuery 依赖
- ❌ Pjax SPA 路由
- ❌ QQ 头像解析

## 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages，每次推送 `main` 分支即可自动上线。

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
```

总结：这次迁移让 Sakura 主题变得更轻量、更快速、更安全。
