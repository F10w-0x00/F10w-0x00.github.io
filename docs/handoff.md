# 项目交接与维护指南 (Handoff Guide)

> **文档版本**：v2.0.0  
> **最后更新**：2026-11-24  
> **适用对象**：后续接手维护者（人类开发者或 AI 助理）

---

## 1. 项目元信息与维护者标识

- **项目名称**：f10w-0x00 个人博客系统 (Personal Blog)
- **线上站点**：[https://f10w-0x00.github.io/](https://f10w-0x00.github.io/)
- **代码仓库**：[GitHub - F10w-0x00/F10w-0x00.github.io](https://github.com/F10w-0x00/F10w-0x00.github.io)
- **Git 官方提交人标识**：
  - `user.name`: `f10w-0x00`
  - `user.email`: `f10w.0x00@gmail.com`
  *(所有提交均须严格保持此身份，以确保 GitHub Contributions 正常统计与身份一致)*
- **核心设计基准**：基于 [kenshelter.com](https://kenshelter.com) 进行 1:1 像素级逆向复刻，融合苹果极简设计理念、Anthropic Sans 现代西文字体排版、莫兰迪低饱和度色彩体系（Design Tokens）与深浅模式无缝切换。

---

## 2. 核心架构与技术栈

- **框架**：[Astro 5.x](https://astro.build/)（纯静态模式 `output: 'static'` + Content Layer `src/content.config.ts` + 原生 `sharp` 图片自动优化）。
- **「一文一盒」内容架构**：文章、封面、正文配图与下载附件全部高内聚收纳于 `posts/YYYY-MM-DD-slug/`（正文 `index.md` + 资源 `assets/`），同时兼容纯文字单文件 `.md`。
- **模块化原生 CSS**：`src/styles/` 按职责拆分为 `tokens.css`、`base.css`、`archive.css`、`article.css`、`responsive.css`，由 `global.css` 统一引入。
- **纯粹交互理念**：客户端交互由集中式 Vanilla JavaScript 驱动（`src/scripts/main.js`），无 React/Vue 运行时开销。
- **编译与集成扩展**：
  - `src/plugins/rehype-blog-content.mjs`：处理同目录附件卡片、图注 Figure、Callout 与外链 Favicon；
  - `src/integrations/post-attachments.mjs`：开发态直出 `/post-assets/` 附件、生产态仅拷贝已发布文章实际引用的附件至 `dist/post-assets/`。
- **长期防劣化脚手架**：`scripts/new-post.mjs`（`pnpm new`）与 `scripts/check-blog.mjs`（`pnpm check`）。
- **运行与构建环境**：标准 Node.js（22+）+ `pnpm@10.5.2`（支持 Windows / macOS / Linux / NixOS）。

---

## 3. 目录拓扑与文件权责划分

```text
.
├── posts/                                # 【核心内容】一文一盒（posts/<slug>/index.md + assets/）
├── public/                               # 【全站公共资产】仅存放头像、Favicon、字体（不放单篇配图）
│   ├── avatar.png
│   ├── favicon.ico / favicon.png
│   ├── favicons/
│   └── fonts/
├── scripts/
│   ├── new-post.mjs                      # pnpm new：一键创建标准文章盒子
│   └── check-blog.mjs                    # pnpm check：断链、孤儿文件、大文件体检
├── src/
│   ├── content.config.ts                 # Astro 5 Content Collections Schema 与图片校验
│   ├── integrations/
│   │   └── post-attachments.mjs          # 同目录附件 dev 服务与 build 拷贝集成
│   ├── layouts/
│   │   └── BaseLayout.astro              # 全局 HTML 骨架（防闪烁脚本、顶栏与设置抽屉）
│   ├── pages/
│   │   ├── index.astro                   # 首页（Recent Posts 网格流）
│   │   ├── rss.xml.js                    # RSS 2.0 订阅端点（过滤草稿、XML/CDATA 转义）
│   │   └── blog/
│   │       ├── index.astro               # 文档归档页（分类/年份筛选、60° 旋转排序、已读小勾）
│   │       └── [slug].astro              # 动态博文渲染页（ Astro 5 render() + <Image> ）
│   ├── plugins/
│   │   └── rehype-blog-content.mjs       # Markdown 编译期插件
│   ├── scripts/
│   │   └── main.js                       # 客户端交互脚本（设置、复制、已读标记）
│   ├── styles/
│   │   ├── global.css                    # 入口文件
│   │   ├── tokens.css / base.css / archive.css / article.css / responsive.css
│   └── utils/
│       ├── post-helpers.mjs              # 纯 Node 辅助函数（日期、Slug、字数统计）
│       └── posts.ts                      # 统一文章查询层（过滤 draft）
├── docs/                                 # 伴随式系统文档库
├── .github/workflows/deploy.yml          # GitHub Actions 自动化部署流水线
├── astro.config.mjs
├── package.json
└── README.md
```

---

## 4. 关键功能与核心交互机制

接手维护时，请重点关注以下核心交互与业务机制，避免反向退化：

### 4.1 代码块与引用块展示
- **全文完整展示**：所有代码块与引用块均默认完整展示，不触发折叠截断；
- **代码块增强**：自动包裹 `.code-block`，展示左上角语言徽标与右上角一键复制按钮，并原生支持横向滚动。

### 4.2 文件资产下载卡片组件 (`.file-asset-card`)
- **极简圆角附件卡片设计**：
  - **左侧**：`38x38px` 柔和蓝灰圆角底块 + 干净的线框折角文档 SVG（无多余文字徽标）；
  - **中间**：第一行为清爽主标题（支持自定义中文标题或物理文件名）；第二行为静默副标格式与物理大小（如 `PDF 文档 · 500 B`）；
  - **右侧**：默认留白，桌面端悬停/聚焦整卡时平滑浮现极简线框下载图标（触屏端常显柔和图标）；
  - **无障碍与原生体验**：整张卡片语义化为带有 `download` 属性的 `<a>` 标签，点击整卡任意位置即可触发原生文件下载。
- **编译期全自动探测引擎**：
  - 静态编译时由 `src/plugins/rehype-blog-content.mjs` 调用 Node.js `fs.statSync`（含 `public/` 路径边界校验）瞬间读取物理文件大小，支持 `B / KB / MB / GB` 智能换算；
  - 零客户端 JavaScript 运行时开销，首屏秒开。

### 4.3 已读博文追踪系统 (`post-card-visited-icon`)
- **存储**：使用 `localStorage['KenShelter-visited-posts']` 存储已读的文章 slug 数组。
- **展示策略**：
  - **仅在文档归档页（`/blog/`）与文章底部的同分类推荐列表中显示绿色小勾**；
  - **首页 Recent Posts 卡片强制保持纯净**，绝不显示小勾或占位裁剪框；
  - 监听浏览器 `pageshow` 事件，在用户从文章页后退返回归档页（BFCache 恢复）时自动触发打勾点亮。

### 4.4 归档多维筛选与等边三角形 60° 旋转排序
- **多维过滤**：话题类型（`category`）与年份（`year`）支持联动过滤，并双向同步 URL 查询参数。
- **等边三角形翻转动效**：排序切换按钮采用等边三角形（`archive-sort-triangle`），每次点击通过纯 CSS 顺时针旋转 60° 模拟几何上下颠倒，流畅平滑。

### 4.5 网站设置抽屉与分段控制器
- **偏好持久化**：存储在 `localStorage` 中（`theme`、`fontSize`、`contentWidth`）。
- **深浅扫光动画**：在支持现代浏览器的环境下，通过 View Transitions API 驱动自上而下的遮罩扫光过渡（`theme-wipe-to-dark` / `theme-wipe-to-light`）。
- **分段控制器 (Segmented Control)**：类似 iOS 的滑动药丸指示器，利用 `data-active-index` 驱动纯 CSS 硬件加速平滑位移，并支持动态判断选项个数（2 或 3 项）。

### 4.6 现代排版与字体系统
- **西文字体栈**：首选导入自托管的高质感 Anthropic Sans（`public/fonts/AnthropicSans_Roman_Web.woff2`），数字与英文字符现代典雅。
- **中文字体回退**：中文无缝回退至系统原生高保真黑体（macOS 苹方 / Windows 微软雅黑），兼顾极致视觉与零体积加载负担。

---

## 5. 日常运维与写作发布指南

### 5.1 撰写与发布新文章（无需本地运行 `pnpm`）
1. **方式 A（直接放文件，零命令行）**：在 `posts/` 下手动新建 `YYYY-MM-DD-your-slug/index.md` 与 `assets/` 子目录（无图纯文字文章也可以直接放 `posts/YYYY-MM-DD-your-slug.md`）；推送或通过 GitHub 网页上传到 `main` 分支，GitHub Actions 会在云端全自动构建上线。
2. **方式 B（可选快捷命令）**：在本地装有 Node/pnpm 时，也可运行 `pnpm new my-slug --title "文章标题" --category 学习` 一键生成目录与模板；
3. 顶部包含标准 YAML Frontmatter（由 `src/content.config.ts` 强类型校验，`title` 和 `date` 必填，其余均可选）：
   ```yaml
   ---
   title: "文章标题"
   description: "文章摘要，用于首页卡片和文章副标题展示"
   date: 2026-11-24
   category: "日常"
   cover: ./assets/cover.png  # 可选，相对路径，建议比例 2:1
   words: 2500                # 可选，留空时自动统计
   draft: false               # 可选，true 时生产构建与 RSS 自动隐藏
   ---
   ```
4. 正文内部一律由二级标题 `##` 开始，**严禁在正文中使用一级标题 `#`**。

### 5.2 放置配图与附件
1. 将本文专属的图片与下载附件（PDF、ZIP、EPUB 等）直接放入当前文章的 **`assets/`** 目录：
   ```text
   posts/2026-11-24-my-slug/assets/my-guide.pdf
   ```
2. 在 `index.md` 中使用相对路径引用：
   - 图片：`![图片说明](./assets/pic.png "可选图注")`（云端构建时自动压缩为 WebP）
   - 附件（单行独占）：`[拔牙术后全周期护理指南](./assets/my-guide.pdf)`

### 5.3 可选：本地开发与构建验证
仅在改造代码或发布前想本地预览时运行：
```bash
# 安装依赖
pnpm install

# 启动本地实时热重载开发服务器 (默认端口 http://localhost:4321)
pnpm start

# 运行内容体检（检查断链、孤儿资源与大文件）与全量构建
pnpm check && pnpm build

# 本地预览编译后的真实静态站点
pnpm preview
```

### 5.4 Git 提交与推送规范
1. **核验 Git 邮箱身份**（确保 GitHub Contributions 正确归属）：
   ```bash
   git config user.email  # 应输出 f10w.0x00@gmail.com
   ```
2. **规范提交并推送**：
   ```bash
   git add -A
   git commit -m "feat/fix/docs/post: 描述修改内容"
   git push origin main
   ```

---

## 6. CI/CD 与 GitHub Pages 部署机制

- **工作流文件**：`.github/workflows/deploy.yml`。
- **触发机制**：当代码 push 到 `main` 分支时自动触发。
- **防 Jekyll 机制**：`public/.nojekyll` 确保 GitHub Pages 不会被 Jekyll 处理，完整保留 `_astro/` 等带下划线的前端资产。
- **自动化步骤**：
  1. 检出代码并设置 Node.js；
  2. 安装 pnpm 与全量依赖；
  3. 执行 `pnpm build` 输出到 `dist/`；
  4. 使用 GitHub 官方 Actions 上传产物并无感发布至 GitHub Pages。

---

## 7. 注意事项与常见踩坑排查

1. **不要直接破坏 `src/styles/tokens.css` 中的 Design Tokens**：
   全站所有颜色均收敛在 `src/styles/tokens.css` 的 `:root`、`html[data-theme=dark]` 与 `html[data-theme=light]` 中（如 `--bg`、`--surface`、`--accent`、`--code-bg`）。改动样式时请复用 Token 或使用 `color-mix(in srgb, ...)`，切忌写死十六进制颜色。
2. **外链 Favicon 自动注入白名单**：
   若需扩展外部链接的 Favicon 图标，请将 16x16 / 32x32 图标放入 `public/favicons/external-links/`，并在 `src/plugins/rehype-blog-content.mjs` 中的 `faviconMap` 登记对应域名。
3. **下载卡片单行独占要求**：
   Markdown 中的文件下载链接必须是所在 `<p>` 标签的唯一有效子元素（即前后换行独占一行）。若将链接写在正文句号中间，系统会智能将其作为正文普通行内链接处理，不会破坏自然段落流。

---

## 8. 关联参考文档

- [README.md](../README.md)：仓库基础说明与写作速查表
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md)：系统底层架构与技术选型
- [docs/COMPONENTS.md](./COMPONENTS.md)：组件 DOM 骨架与客户端交互规范
- [docs/DESIGN_TOKENS.md](./DESIGN_TOKENS.md)：莫兰迪色彩体系与设计参数
- [docs/TYPOGRAPHY_AND_STYLE_GUIDE.md](./TYPOGRAPHY_AND_STYLE_GUIDE.md)：博客全量排版与写作活范例
- [CHECKLIST.md](../CHECKLIST.md)：Feature 交付与三态门禁状态表
