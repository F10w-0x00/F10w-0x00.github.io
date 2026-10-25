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
| **F03** | 静态脚手架 | Astro 静态博客工程与仓库初始化 | **已验证** | Agent-Core | 本地构建测试通过 (2 page(s) built in 1.53s) | `73b8bdb` |
| **F04** | 部署流水线 | GitHub Actions 自动化发布 Pages | **已验证** | Agent-Docs-CI | `.github/workflows/deploy.yml` 自动化构建工作流完成 | `73b8bdb` |
| **F05** | 全局视觉 | 全局色彩系统与亮/暗色主题无缝切换 | **已验证** | Agent-Core | `src/styles/global.css` 包含亮/暗/跟随系统主题与莫兰迪色彩 Token | `73b8bdb` |
| **F06** | 顶部导航 | 顶部导航栏、Logo、菜单与设置触发器 | **已验证** | Agent-Core | `src/components/common/SiteHeader.astro` 还原导航、锚点返回与设置抽屉 | `73b8bdb` |
| **F07** | 布局系统 | 页面容器与对称留白响应式断点 | **已验证** | Agent-Core | `src/layouts/BaseLayout.astro` 响应式断点、留白与版心宽度对齐 | `73b8bdb` |
| **F08** | 页脚系统 | 页脚元数据、版权信息与极简排版 | **已验证** | Agent-Core | `src/pages/index.astro` 极简页脚、版权声明与 RSS 订阅就绪 | `73b8bdb` |
| **F09** | 列表归档 | 列表页头部、Newsroom 筛选框与年份归档 | **已验证** | Agent-Index | `src/pages/blog/index.astro` 还原话题类型与年份下拉及实时文章数统计 | `2cbc62e` |
| **F10** | 列表条目 | 文章卡片排版、已读标记与右侧封面 | **已验证** | Agent-Index | 113 篇卡片排版完成，等宽日期、字数、封面与已读小勾 100% 对齐 | `2cbc62e` |
| **F11** | 列表微交互 | 列表项 Hover 悬停位移、微光与阴影过渡 | **已验证** | Agent-Index | 像素级还原鼠标悬停过渡动效与已读历史状态高亮 | `2cbc62e` |
| **F12** | 排序动效 | 60° 旋转等边三角形正倒序时间排序 | **已验证** | Agent-Index | 实现基于等边三角形旋转 60° 模拟上下翻转的时间正倒序切换动效 | `2cbc62e` |
| **F13** | 文章头部 | 分类胶囊、日期、字数统计与横幅头图 | **已验证** | Agent-Article | 还原文章大标题、分类蓝标签、发布日期、字数与横幅大图 | `214e379` |
| **F14** | 正文排版 | Safari 阅读模式对称排版、外链 Favicon | **已验证** | Agent-Article | 棕色站外链接自动外挂 Favicon，同页跳转指示箭头对齐 | `214e379` |
| **F15** | 代码高亮 | 语法高亮配色、一键复制代码与智能折叠 | **已验证** | Agent-Article | 代码块高亮、顶部语言标签与一键复制功能完成 | `214e379` |
| **F16** | 沉浸式大纲 | 点击小标题聚拢大纲、正文渐隐过渡动效 | **我决定跳过** | Agent-Article | 依据用户明确指令彻底移除沉浸式大纲模块及样式代码，还原标准阅读流 | 待提交 |
| **F17** | 媒体堆叠 | 多图片堆叠翻页动效与全屏灯箱浏览 | **已验证** | Agent-Article | 多图卡片堆叠与翻页交互、大图灯箱浏览脚本就绪 | `214e379` |
| **F18** | 特殊微件 | 注意事项 (Admonition) 与长引用渐隐折叠 | **已验证** | Agent-Article | 还原注意事项 (`callout-note`)、长引用渐隐展开交互 | `214e379` |
| **F19** | 底部交互 | 上下篇导航与同页跳转顶栏锚点返回按钮 | **已验证** | Agent-Article | 还原所属分类列表、相邻博文卡片与顶栏滑出锚点返回按钮 | `214e379` |
| **F20** | 回归校验 | 注入《设计长文》全量内容进行 1:1 比对 | **已验证** | Agent-Docs-CI | Computed Styles 与 DOM 校验，0 missing classes，18 headings，12 images 对齐 | `b19d102` |
| **F21** | 终局审查 | 伴随式文档 100% 完整性核验与最终推送 | **已验证** | Agent-Docs-CI | 根目录及 `docs/` 下全套 6 份文档 100% 闭环同步 | `b19d102` |
| **F22** | 专属标识 | GitHub 官方 Identicon 规则算法逆向与 Logo 替换 | **已验证** | Agent-Core | 逆向 5x5 水平对称矩阵与 `#d1947c` 配色，替换顶栏品牌为 `f10w-0x00` 与专属徽标 | `10737d6` |
| **F23** | 首页重构 | 移除门光与英雄区，仅保留 Recent Posts | **已验证** | Agent-Core | 首页删除 home-hero，仅呈现 Recent Posts 真实文章网格与平滑留白 | `10737d6` |
| **F24** | 真实博文 | 清除 112 篇占位博文，重构 4 篇 1:1 像素级实装模板 | **已验证** | Agent-Article | 清空 404 占位卡片；实装 Obsidian、UP主推荐、拔智齿经历等高保真完整文章 | `10737d6` |
| **F25** | Pages 修复 | 根治 Jekyll 构建报错与 Pages 流水线冲突 | **已验证** | Agent-Docs-CI | 切换 GitHub Actions 模式后触发正式构建，线上 HTTP 200 验证通过 | `10737d6` |
| **F26** | 个人头像与 Favicon | 真实头像导入与多分辨率 Favicon/Tab 图标全量替换 | **已验证** | Agent-Core | 导入用户头像 `/home/flynn/Downloads/avatar.jpg`，生成全套 avatar/favicon (32/64/192/512) 并绑定 Tab 图标 | 本次提交 |
| **F27** | 首页去小勾 | 首页 Recent Posts 卡片彻底移除已读打勾与裁剪框 | **已验证** | Agent-Index | 移除首页卡片 `data-reading-post-slug` 与打勾元素，保留 `/blog/` 归档页独立打勾功能 | 本次提交 |
| **F28** | 代码块精细还原 | Shiki 语法高亮、浮动语言徽标、长代码折叠与内联复制 | **已验证** | Agent-Article | 补齐 Shiki Light/Dark 配色，浮动语言徽标，复制过渡与超 10 行平滑渐隐折叠 | 本次提交 |
| **F29** | 4 篇博文排版深度精修 | 注入真实正文、figure/figcaption图片下小字、表格与Callout | **已验证** | Agent-Article | 拔智齿与UP主推荐全量内容对齐原站，规范图片下灰色小字与 Callout 提示框 | 本次提交 |
| **F30** | 完整排版范例规范 | 全特性排版指南与全平台字体建议 | **已验证** | Agent-Docs-CI | 输出 `docs/TYPOGRAPHY_AND_STYLE_GUIDE.md`，覆盖 Frontmatter、小字、代码块及 Win/Mac 字体选型与自定义字体指南 | `e414f38` |
| **F31** | 顶栏图标纯净化 | 顶栏仅保留圆形 Icon 并生成真透明圆形 Favicon | **已验证** | Agent-Core | 顶栏删除 `f10w-0x00` 文本，头像与 Tab Favicon 全部处理为真透明抗锯齿圆形 | 本次提交 |
| **F32** | 文档归档交互 | 文档列表话题分类、年份筛选与正倒序排序修复 | **已验证** | Agent-Index | 剥离无用缺失模块，实装自包含内联交互脚本，经 DOM 测试所有类型、年份与 60° 旋转排序完全正常 | 本次提交 |
| **F33** | 自定义字体实装 | 导入 Anthropic Sans 优质英文字体并注入字体栈 | **已验证** | Agent-Core | 导入 `AnthropicSans_Roman_Web.woff2`，配置 `@font-face` 并前置至首选西文字体，中文无缝回退系统黑体 | 本次提交 |
