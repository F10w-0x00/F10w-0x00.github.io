# f10w-0x00 的个人博客 (Personal Blog)

本博客基于 [Astro 5](https://astro.build/) 构建，采用**「一文一盒（Page Bundle）」自包含内容架构** + Astro 5 原生 Content Collections 与自动图片优化管线。

- **线上地址**：[https://f10w-0x00.github.io/](https://f10w-0x00.github.io/)
- **长期主义设计**：每篇文章是一个独立文件夹（文字、封面、插图、PDF 附件全在盒内），删文章零残留、换编辑器所见即所得、10 年不锁死框架。

---

## 目录结构

```text
.
├── posts/                                      # 【唯一写作目录】一文一盒，纯标准 Markdown
│   ├── 2026-10-01-how-i-use-obsidian/          # 一篇文章 = 一个自包含盒子
│   │   ├── index.md                            # 正文
│   │   └── assets/                             # 本文专属封面、配图与下载附件
│   └── 2026-11-24-short-note.md                # 【兼容】无图纯文字文章也可直接放单文件 .md
├── public/                                     # 【全站公共资产】只放头像、Favicon 与字体（不放文章配图）
│   ├── avatar.png
│   ├── favicon.png / favicon.ico
│   ├── favicons/                               # Apple Touch Icon 与外链 Favicon
│   └── fonts/                                  # Anthropic Sans Web 字体
├── scripts/
│   ├── new-post.mjs                            # pnpm new：一键创建标准文章盒子
│   └── check-blog.mjs                          # pnpm check：断链、孤儿资源与大文件体检
├── src/
│   ├── content.config.ts                       # Astro 5 Content Layer Schema（含图片存在性校验）
│   ├── integrations/
│   │   └── post-attachments.mjs                # 同目录下载附件 dev 服务与 build 自动拷贝
│   ├── layouts/
│   │   └── BaseLayout.astro                    # 全局骨架（防闪烁偏好脚本、顶栏、设置抽屉）
│   ├── pages/
│   │   ├── index.astro                         # 首页（Recent Posts 最新 4 篇）
│   │   ├── rss.xml.js                          # RSS 2.0 订阅端点（含 XML/CDATA 转义，自动过滤草稿）
│   │   └── blog/
│   │       ├── index.astro                     # 文档归档页（分类/年份过滤 + 60°旋转排序）
│   │       └── [...slug].astro                 # 动态文章详情页（兼容单段与子目录路径）
│   ├── plugins/
│   │   └── rehype-blog-content.mjs             # 编译期插件（极简下载卡片、图注、Callout、外链图标）
│   ├── scripts/
│   │   └── main.js                             # 客户端交互（设置抽屉、已读标记、代码一键复制）
│   ├── styles/
│   │   ├── global.css                          # 样式总入口
│   │   ├── tokens.css                          # 莫兰迪亮/暗色 Design Tokens 与字体栈
│   │   ├── base.css                            # 基础重置、容器、顶栏与设置抽屉
│   │   ├── archive.css                         # 首页卡片与文档归档页
│   │   ├── article.css                         # 正文排版、代码块、Callout 与下载卡片
│   │   └── responsive.css                      # 响应式断点
│   └── utils/
│       ├── post-helpers.mjs                    # 纯 Node 辅助函数（日期兜底、Slug 规范化、自动字数统计）
│       └── posts.ts                            # 统一文章查询层（基于 astro:content）
├── astro.config.mjs
└── package.json
```

---

## 如何发布新文章（无需本地运行 `pnpm`）

**日常写博客完全不需要在本地安装 Node.js 或敲任何 `pnpm` 命令**。只要把文章放进 `posts/` 并推送或上传到 GitHub `main` 分支，GitHub Actions 云端就会自动压缩图片、统计字数、编译并发布上线（约 1–2 分钟）：

1. **纯文字文章（无图）**：直接把 `YYYY-MM-DD-your-slug.md` 放入 `posts/` 即可。
2. **带图片或 PDF 附件的文章（推荐「一文一盒」）**：在 `posts/` 下新建目录 `YYYY-MM-DD-your-slug/`，里面放正文 `index.md` 和资源子目录 `assets/`：
   ```text
   posts/2026-11-24-my-note/
   ├── index.md
   └── assets/
       ├── cover.png
       └── guide.pdf
   ```
3. **文章顶部只需写最简 Frontmatter**（`title` 和 `date` 必填，其余全可选）：
   ```yaml
   ---
   title: "文章标题"
   date: 2026-11-24
   ---
   ```

---

## 可选：本地预览与辅助命令

只有当你想**在发布前本地预览网页效果**，或使用快捷建稿 / 体检工具时，才需要在本地（Node.js 22+ & pnpm / `corepack`）运行以下命令：

```bash
# 安装依赖（仅首次本地预览需要）
pnpm install

# 可选：一键新建文章盒子（自动生成 posts/YYYY-MM-DD-<slug>/index.md + assets/）
pnpm new my-topic --title "文章标题" --category 学习

# 可选：本地实时预览（草稿可见，附件实时可下载）
pnpm start

# 可选：全站内容体检（检查断链、孤儿图片/附件、超大图片与 Frontmatter）
pnpm check

# 可选：本地静态构建与预览产物
pnpm build
pnpm preview
```

---

## 编辑器「截图直贴 `./assets/`」配置

配置后，在编辑器里写 `index.md` 时直接 `Ctrl+V` 贴图，图片会自动存进当前文章的 `assets/` 并实时显示，无需手打路径：

- **Obsidian**：设置 → 文件和链接 → 新附件的默认存放位置 → 选「**当前文件所在文件夹下指定的子文件夹中**」→ 填 `assets`，并将链接格式设为「**相对路径**」。
- **VS Code**：在用户设置（或 `.vscode/settings.json`）中添加：
  ```json
  {
    "markdown.copyFiles.destination": {
      "posts/**": "assets/${fileName}"
    }
  }
  ```
- **Typora**：偏好设置 → 图像 → 插入图片时选择「**复制图片到指定路径**」→ 填 `./assets`，勾选「**优先使用相对路径**」。

---

## Markdown 写作语法速查表

### 1. Frontmatter 元数据模板

```yaml
---
title: "文章标题"
description: "文章摘要，用于首页卡片和文章副标题展示"
date: 2026-10-25
category: "学习"
cover: ./assets/cover.png  # 可选：相对路径，构建时自动校验存在性并压缩优化
words: 2500                # 可选：留空时构建期自动统计中文字数与英文词数
draft: false               # 可选：设为 true 时本地开发可见，生产构建与 RSS 自动隐藏
---
```

### 2. 图片与带图注图片（自动压缩为 WebP）

直接放普通 PNG/JPG 到本文 `./assets/` 即可，构建时自动压缩并注入真实宽高防抖动：

```markdown
![图片替代文本](./assets/example.png "显示在图片下方的居中灰色图注")
![纯图片不带图注](./assets/plain.png)
```

### 3. 文件下载卡片（同目录自动探测体积）

将 PDF、ZIP、EPUB、MD 等附件放入本文 `./assets/`，在 Markdown 中**单行独立引用**即可渲染出极简圆角下载卡片（默认清爽留白，悬停右侧平滑浮现极简下载图标）：

```markdown
[拔牙术后全周期护理指南](./assets/wisdom-tooth-care-guide.pdf)
```

> 若文件体积较大（> 15 MB），建议上传至 GitHub Releases 并直接用外部直链单行引用，同样会自动渲染为极简下载卡片。

### 4. 提示框 (Callouts)

原生支持 5 种 GitHub / Obsidian Alert 提示框（`NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`，浅/深双色莫兰迪配色），以及 `[!NOTE CALLOUT-ICON-ONLY]` 纯图标样式：

```markdown
> [!TIP] 实用技巧
> 这里写提示内容，支持粗体、行内代码、链接与数学公式。
```

### 5. LaTeX 数学公式（KaTeX 编译期渲染）

由 `remark-math` + `rehype-katex` 在静态编译期渲染为纯 HTML，零客户端 JS 开销，支持行内与块级公式：

```markdown
行内公式：$E = mc^2$、$\mathcal{O}(n \log n)$

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$
```

### 6. 代码块、表格与外链

- **代码块**：原生 Shiki 双主题高亮（浅色 GitHub Light / 深色 GitHub Dark）+ 左上角语言徽标 + 右上角一键复制（全文完整展示，不折叠）。
- **外链**：非本站 `https://` 链接自动新标签页打开并转为莫兰迪棕色，白名单站点自动附带本地 Favicon。
- **表格**：标准 GFM 表格语法，窄屏自动横向滚动。
- **全特性活范例**：可直接参考 `posts/2026-11-24-style-and-syntax-showcase/index.md`。
