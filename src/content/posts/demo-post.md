---
title: "Sakura 主题功能演示"
description: "这是一篇完整的功能演示文章，展示 Sakura 主题支持的全部 Markdown 格式。"
date: 2026-05-16
updated: 2024-04-20
category: "示例"
cover: "/images/random/d-8.jpg"
---

本文演示 Sakura 主题的全部富文本渲染效果。

## 文本格式

这是 **粗体** 文本，这是 *斜体* 文本，这是 ~~删除线~~。还可以使用 `行内代码` 高亮关键词。

这是 [Sakura 主题仓库](https://github.com/peiy-meguru/sakura-astro) 的链接。

## 图片展示

Sakura 支持图片灯箱，**点击图片** 可以全屏查看：

![占位图 - 粉色](/images/random/d-1.jpg "粉色渐变占位图")
*粉色渐变占位图*

![占位图 - 蓝色](/images/random/d-2.jpg "蓝色渐变占位图")
*蓝色渐变占位图*

## 列表

### 无序列表

- 优雅的动画过渡
- 8 种可切换皮肤
- 暗色 / 亮色模式
- 响应式布局

### 有序列表

1. 创建 Markdown 文件
2. 添加 frontmatter 元数据
3. 编写文章内容
4. 提交到仓库自动部署

### 任务列表

- [x] 完成主题重构
- [x] 添加暗色模式
- [x] 实现全文搜索
- [ ] 添加评论系统
- [ ] 实现 RSS 订阅

## 引用

> 樱花飘落的速度是每秒五厘米。我该用什么样的速度去生活，才能与你相逢？
>
> — 秒速五厘米

嵌套引用：

> 第一层引用
>
> > 第二层嵌套引用
> >
> > 内容可以更深

## 代码块

### Python

```python
import asyncio

class SakuraBlog:
    def __init__(self, name: str) -> None:
        self.name = name

    async def publish(self, content: str) -> str:
        await asyncio.sleep(0.1)
        return f"[{self.name}] {content}"

blog = SakuraBlog("樱花庄")
print(asyncio.run(blog.publish("Hello, Astro!")))
```

### TypeScript

```typescript
interface Post {
  title: string;
  date: Date;
  tags: string[];
  cover?: string;
  sticky: boolean;
}

function sortPosts(posts: Post[]): Post[] {
  return posts.toSorted((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return b.date.getTime() - a.date.getTime();
  });
}
```

### Bash

```bash
# 构建并预览博客
npm run build
npx serve dist

# 在新端口开发
npm run dev -- --port 3000
```

## 表格

| 浏览器 | 渲染引擎 | 支持度 |
|--------|----------|--------|
| Chrome | Blink | ✅ 完全支持 |
| Firefox | Gecko | ✅ 完全支持 |
| Safari | WebKit | ✅ 完全支持 |
| Edge | Blink | ✅ 完全支持 |

## 分割线

上面是表格，下面是一条分割线：

---

分割线在 Sakura 主题中会渲染为 `...` 符号。

## 展开/折叠

<details>
<summary>点击展开隐藏内容</summary>

这里是隐藏的内容。可以放一些附加信息或长篇引用。

- 支持 Markdown 格式
- 支持代码块
- 支持列表

</details>

## 键盘快捷键

使用 <kbd>Ctrl</kbd> + <kbd>K</kbd> 打开搜索框。

---

**总结**：Sakura 主题完整支持标准 Markdown 语法，并且在此基础上加入了代码高亮、图片灯箱、暗色模式等特性。开始使用它来书写你的故事吧 🌸
