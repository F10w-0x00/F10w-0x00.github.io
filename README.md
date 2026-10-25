# f10w-0x00 的个人博客 (Personal Blog)

本博客基于 [Astro](https://astro.build/) 构建，全站采用极致扁平化架构与 100% 纯 Markdown 发布工作流。

- **线上地址**：[https://f10w-0x00.github.io/](https://f10w-0x00.github.io/)
- **技术特色**：静态生成（Static Output）、零冗余依赖、Anthropic Sans 现代排版、全套暗黑/明亮主题与自适应字号。

---

## 目录结构

```text
.
├── posts/                        # 【唯一写作目录】所有文章均为纯 .md 格式
│   ├── 2026-10-01-how-i-use-obsidian.md
│   ├── 2026-07-25-recommended-up-creators-im-following-part-3.md
│   ├── 2026-07-20-my-wisdom-tooth-extraction-experience.md
│   └── 2026-06-10-visual-and-interaction-design-of-this-blog-site.md
├── public/                       # 静态资源
│   ├── avatar.png                # 个人头像 Logo
│   ├── favicon.png / favicon.ico # 浏览器 Favicon
│   ├── fonts/                    # Anthropic Sans Web 字体
│   └── images/                   # 文章配图与封面图
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # 全局骨架（防闪烁偏好脚本、顶栏、设置抽屉）
│   ├── pages/
│   │   ├── index.astro           # 首页（Hero + Recent Posts）
│   │   ├── rss.xml.js            # RSS 订阅生成端点
│   │   └── blog/
│   │       ├── index.astro       # 文档归档页（分类/年份过滤 + 60°旋转排序）
│   │       └── [slug].astro      # 文章详情动态路由（自动渲染 posts/*.md）
│   ├── styles/
│   │   └── global.css            # 全局样式表
│   ├── scripts/
│   │   └── main.js               # 全局客户端交互（设置、已读标记、代码块复制与折叠）
│   └── plugins/
│       └── rehype-blog-content.mjs # Markdown 语法编译器插件（Callout、图注、外链图标）
├── astro.config.mjs              # Astro 核心配置文件
└── package.json
```

---

## 本地开发与构建

在 NixOS 或已安装 Node.js 的环境下运行：

```bash
# 启动本地开发服务器
pnpm start
# 或
nix-shell -p nodejs pnpm --run "pnpm start"

# 生产环境编译构建
pnpm build
# 或
nix-shell -p nodejs pnpm --run "pnpm build"

# 本地预览构建产物
pnpm preview
```

---

## Markdown 写作语法速查表

发布新文章仅需在 `posts/` 目录下创建一个新的 `YYYY-MM-DD-your-slug.md` 文件：

### 1. Frontmatter 元数据模板

```yaml
---
title: "文章标题"
description: "文章摘要，用于首页卡片和文章副标题展示"
date: 2026-10-25
cover: "/images/your-cover-image.avif"
category: "技术"
words: 2500 # 可选：显式指定字数或留空由构建程序自动统计
---
```

### 2. 提示框 (Callouts / Alerts)

支持标准 GitHub / Obsidian 风格提示框：

```markdown
> [!NOTE] 提示框标题
> 这里是主要说明内容。支持粗体、链接与换行。

> [!TIP] 实用技巧
> 这里是最佳实践或操作建议。

> [!WARNING] 注意事项
> 这里是预警与防坑说明。
```

### 3. 代码块 (Code Blocks)

原生支持 Shiki 语法高亮、右上角一键复制与长代码自动折叠：

````markdown
```bash
#!/usr/bin/env bash
echo "Hello World"
```
````

### 4. 图片与带图注图片 (Figures)

- **带图注图片**（在 title 中填写图注文字，将自动编译为 `<figure>` + `<figcaption>`）：
  ```markdown
  ![图片替代文本](/images/example.avif "这是显示在图片下方的居中图注文字")
  ```
- **纯图片**（不含 title）：
  ```markdown
  ![图片替代文本](/images/example.avif)
  ```

### 5. 外链与自动 Favicon

所有以 `https://` 开头的非本站链接，会自动在新标签页打开，并匹配显示对应域名（如 Obsidian、Bilibili、GitHub、Apple、Wikipedia 等）的 Favicon 图标：

```markdown
访问 [Obsidian 官网](https://obsidian.md) 了解更多本地优先哲学。
```

### 6. 表格 (GFM Tables)

```markdown
| 维度 | 现象 | 应对策略 |
| :--- | :--- | :--- |
| 性能 | 高速加载 | 静态预渲染 |
| 维护 | 架构简单 | 纯 Markdown 驱动 |
```
