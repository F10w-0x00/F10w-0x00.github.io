# 系统架构设计说明 (Architecture)

## 1. 核心架构理念（长期主义「一文一盒」）

本博客遵循**三层严格分离**原则，确保写作 5–10 年也不会演变为孤儿图片与杂乱样式堆积的“屎山”：

1. **纯内容层 (`posts/`)**：采用 **Page Bundle（一文一盒）** 结构，每篇文章拥有独立文件夹 `posts/YYYY-MM-DD-slug/index.md` 与 `assets/` 子目录，同时兼容无图单文件 `posts/YYYY-MM-DD-slug.md`。100% 标准 Markdown + 相对路径，与框架完全解耦。
2. **全站公共资产层 (`public/`)**：仅存放站点级共享资产（头像、Favicon、外链 Favicon），永不混入单篇文章配图或附件；西文与代码字体由 `@fontsource-variable/*` 在构建期自托管输出至 `dist/_astro/`，中文直接走操作系统原生 Hinting 字体（Win 微软雅黑 / Mac 苹方）。
3. **纯程序层 (`src/` & `scripts/`)**：
   - **Astro 5 Content Layer (`src/content.config.ts`)**：通过 `glob()` loader 托管 `posts/`，配合 Zod 强类型 Schema 与原生 `image()` 校验，编译期拦截缺失封面/非法日期，并由内置 `sharp` 自动将原图优化为现代 WebP。
   - **Markdown 编译扩展**：`remark-math` + `rehype-katex`（编译期零 JS 渲染 LaTeX 公式，自托管 `katex` CSS/字体）+ 自定义 `rehype-blog-content.mjs`（极简下载卡片、图注、5 种 Callout、外链图标）+ `post-attachments.mjs` 附件集成。
   - **模块化原生 CSS (`src/styles/`)**：拆分为 `tokens.css`、`base.css`、`archive.css`、`article.css`、`responsive.css` 五层，构建期自动合并压缩。
   - **集中式轻量化交互 (`src/scripts/main.js`)**：零前端框架依赖，仅负责设置抽屉、View Transitions 主题扫光、已读打勾与代码块一键复制。
   - **自动化防劣化脚手架 (`scripts/`)**：`pnpm new` 标准化创建文章盒子，`pnpm check` 一键检查断链、孤儿文件、超大图片与 Frontmatter 完整性。

---

## 2. 工程目录拓扑

```text
.
├── posts/                                # 核心内容层（一文一盒：index.md + assets/）
├── public/                               # 全站公共静态资产（avatar、favicon、favicons）
├── scripts/
│   ├── new-post.mjs                      # 一键创建文章盒子
│   └── check-blog.mjs                    # 全站断链 / 孤儿资源 / 大文件体检
├── docs/                                 # 系统设计与排版规范文档
├── src/
│   ├── content.config.ts                 # Astro 5 Content Collections Schema
│   ├── integrations/
│   │   └── post-attachments.mjs          # 同目录附件 dev/build 集成
│   ├── layouts/
│   │   └── BaseLayout.astro              # 全局骨架、防闪烁脚本、顶栏与设置抽屉
│   ├── pages/
│   │   ├── index.astro                   # 首页（Recent Posts）
│   │   ├── blog/
│   │   │   ├── index.astro               # 文档归档页（分类/年份过滤、60° 排序、已读打勾）
│   │   │   └── [...slug].astro           # 动态文章详情页（兼容任意子目录路径）
│   │   └── rss.xml.js                    # RSS 2.0 订阅源（自动过滤草稿、XML/CDATA 转义）
│   ├── plugins/
│   │   └── rehype-blog-content.mjs       # Rehype 插件（下载卡片、图注、Callout、外链图标）
│   ├── scripts/
│   │   └── main.js                       # 客户端主脚本
│   ├── styles/
│   │   ├── global.css                    # 总入口
│   │   ├── tokens.css                    # Design Tokens 与字体声明
│   │   ├── base.css                      # 基础重置、顶栏与设置抽屉
│   │   ├── archive.css                   # 首页与归档页样式
│   │   ├── article.css                   # 文章正文、代码块、Callout 与下载卡片
│   │   └── responsive.css                # 响应式断点
│   └── utils/
│       ├── post-helpers.mjs              # 纯 Node 辅助方法（日期、Slug、字数统计）
│       └── posts.ts                      # 统一文章查询与排序层
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 3. 发布与可选本地命令

- **日常发布（零命令行）**：直接将单篇 `.md` 或「一文一盒」文件夹放入 `posts/` 并推送/网页上传至 GitHub `main` 分支，GitHub Actions（`.github/workflows/deploy.yml`）会在云端自动完成构建、图片压缩与上线。
- **可选本地命令**（仅在本地预览、改造代码或运行快捷脚本时需要）：

```bash
pnpm install        # 安装依赖（含 astro 与 sharp）
pnpm new <slug>     # 可选：快捷创建新文章盒子
pnpm start          # 可选：启动本地开发服务（http://localhost:4321）
pnpm check          # 可选：运行内容与资源体检
pnpm build          # 可选：本地静态打包至 dist/（自动优化图片并过滤草稿）
pnpm preview        # 可选：本地预览 dist/
```
