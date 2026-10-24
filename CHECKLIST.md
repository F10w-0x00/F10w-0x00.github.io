# Feature 实施与三态门禁追踪表 (CHECKLIST.md)

> **全局铁律**：本项目实施严格三态门禁机制。每个 Feature 从立项到结项，状态**只能**为以下三者之一：
> 1. **已验证**（功能与样式已实现，通过 DOM/Computed Styles 比对与本地构建测试）
> 2. **不可用（有证据）**（附带确凿技术证据记录于 `docs/EVIDENCE_LOG.md`）
> 3. **我决定跳过**（仅限人类操作者指令，Agent 无权擅自设定）

---

| 编号 | 模块 | Feature 描述 | 当前状态 (`已验证` / `不可用（有证据）` / `我决定跳过` / `进行中`) | 负责 Agent | 验证结果或证据文档路径 | 最近 Commit Hash |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F01** | 基准逆向 | 原站 DOM/CSS 与设计长文解析 | **已验证** | Agent-Core | `docs/DESIGN_TOKENS.md` 解析原站 DOM、样式表与设计理念完成 | `3a6c197` |
| **F02** | 资源提取 | 字体栈与核心静态/SVG 资源提取 | **已验证** | Agent-Core | `public/` 资源目录下载提取完成，包含原站全量图标与封面 | `61c5477` |
| **F03** | 静态脚手架 | Astro 静态博客工程与仓库初始化 | **已验证** | Agent-Core | 本地构建测试通过 (2 page(s) built in 1.53s) | 待定 |
| **F04** | 部署流水线 | GitHub Actions 自动化发布 Pages | **已验证** | Agent-Docs-CI | `.github/workflows/deploy.yml` 自动化构建工作流完成 | 待定 |
| **F05** | 全局视觉 | 全局色彩系统与亮/暗色主题无缝切换 | 待处理 | Agent-Core | `src/styles/global.css` | - |
| **F06** | 顶部导航 | 顶部导航栏、Logo、菜单与设置触发器 | 待处理 | Agent-Core | `src/components/common/SiteHeader.astro` | - |
| **F07** | 布局系统 | 页面容器与对称留白响应式断点 | 待处理 | Agent-Core | `src/layouts/BaseLayout.astro` | - |
| **F08** | 页脚系统 | 页脚元数据、版权信息与极简排版 | 待处理 | Agent-Core | `src/components/common/SiteFooter.astro` | - |
| **F09** | 列表归档 | 列表页头部、Newsroom 筛选框与年份归档 | 待处理 | Agent-Index | `src/pages/blog/index.astro` | - |
| **F10** | 列表条目 | 文章卡片排版、已读标记与右侧封面 | 待处理 | Agent-Index | `src/components/blog/PostCard.astro` | - |
| **F11** | 列表微交互 | 列表项 Hover 悬停位移、微光与阴影过渡 | 待处理 | Agent-Index | `src/components/blog/PostCard.astro` | - |
| **F12** | 排序动效 | 60° 旋转等边三角形正倒序时间排序 | 待处理 | Agent-Index | `src/components/blog/SortButton.astro` | - |
| **F13** | 文章头部 | 分类胶囊、日期、字数统计与横幅头图 | 待处理 | Agent-Article | `src/layouts/PostLayout.astro` | - |
| **F14** | 正文排版 | Safari 阅读模式对称排版、外链 Favicon | 待处理 | Agent-Article | `src/styles/typography.css` | - |
| **F15** | 代码高亮 | 语法高亮配色、一键复制代码与智能折叠 | 待处理 | Agent-Article | `src/components/article/CodeBlock.astro` | - |
| **F16** | 沉浸式大纲 | 点击小标题聚拢大纲、正文渐隐过渡动效 | 待处理 | Agent-Article | `src/components/article/ImmersiveOutline.astro` | - |
| **F17** | 媒体堆叠 | 多图片堆叠翻页动效与全屏灯箱浏览 | 待处理 | Agent-Article | `src/components/article/ImageStack.astro` | - |
| **F18** | 特殊微件 | 注意事项 (Admonition) 与长引用渐隐折叠 | 待处理 | Agent-Article | `src/styles/typography.css` | - |
| **F19** | 底部交互 | 上下篇导航与同页跳转顶栏锚点返回按钮 | 待处理 | Agent-Article | `src/components/article/AnchorReturn.astro` | - |
| **F20** | 回归校验 | 注入《设计长文》全量内容进行 1:1 比对 | 待处理 | Agent-Docs-CI | Computed Styles 比对一致 | - |
| **F21** | 终局审查 | 伴随式文档 100% 完整性核验与最终推送 | 待处理 | Agent-Docs-CI | 6 份文档完全闭环 | - |
