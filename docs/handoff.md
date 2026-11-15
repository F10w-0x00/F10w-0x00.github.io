# 项目交接与维护指南 (Handoff Guide)

> **文档版本**：v1.0.0  
> **最后更新**：2026-11-15  
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

- **框架**：[Astro 5.x](https://astro.build/)（采用纯静态模式 `output: 'static'`，产物直接由 GitHub Pages 托管）。
- **纯净样式理念**：全站使用现代原生 CSS 与 CSS Custom Properties，**无** Tailwind CSS、**无** CSS-in-JS 框架，无预设类名污染。
- **纯粹交互理念**：客户端交互由集中式 Vanilla JavaScript 驱动（位于 `src/scripts/main.js`），无庞大的 React/Vue 运行时开销，保证首屏秒开。
- **静态 Markdown 编译器扩展**：通过自定义 Rehype 插件（`src/plugins/rehype-blog-content.mjs`）在静态编译期处理 Callout 提示框、图片 Figure 图注、外链 Favicon 自动注入，以及**附件真实物理大小与格式全自动探测**。
- **运行与构建环境**：Linux / NixOS，通过 `nix-shell -p nodejs pnpm git` 提供底层编译支持。

---

## 3. 目录拓扑与文件权责划分

```text
/home/flynn/Documents/Blog/
├── posts/                                # 【核心内容】博客所有正文（100% 纯 Markdown 驱动）
│   ├── 2026-06-10-visual-and-interaction-design-of-this-blog-site.md
│   ├── 2026-07-20-my-wisdom-tooth-extraction-experience.md
│   ├── 2026-07-25-recommended-up-creators-im-following-part-3.md
│   └── 2026-10-01-how-i-use-obsidian.md
├── public/                               # 静态资产目录（打包时原样输出至站点根路径）
│   ├── avatar.png / avatar.jpg           # 个人头像徽标
│   ├── favicon.ico / favicon.png         # 浏览器标签页真透明高清图标
│   ├── files/                            # 【附件目录】供读者下载的 PDF、ZIP 等附件
│   ├── fonts/                            # Anthropic Sans Web 字体 (woff2)
│   ├── favicons/external-links/          # 站外链接自动外挂的 Favicon 图标
│   └── images/                           # 文章封面与正文插图
├── src/
│   ├── components/common/
│   │   └── SiteHeader.astro              # 顶栏导航、品牌圆形头像、锚点返回按钮与设置抽屉入口
│   ├── layouts/
│   │   └── BaseLayout.astro              # 全局 HTML 骨架（防白屏闪烁偏好脚本、全局 Header/Footer）
│   ├── pages/
│   │   ├── index.astro                   # 首页（Recent Posts 网格流，保持纯净无已读小勾）
│   │   ├── rss.xml.js                    # RSS 2.0 订阅端点
│   │   └── blog/
│   │       ├── index.astro               # 文档归档页（分类/年份筛选、60° 旋转排序、已读小勾）
│   │       └── [slug].astro              # 动态博文渲染页（目录元数据、图注、相邻翻页、分类归属）
│   ├── plugins/
│   │   └── rehype-blog-content.mjs       # Markdown 编译器插件（核心扩展逻辑）
│   ├── scripts/
│   │   └── main.js                       # 集中式客户端交互脚本（设置、折叠、复制、打勾）
│   ├── styles/
│   │   └── global.css                    # 全局统一样式表（Design Tokens、组件类名、暗色模式）
│   └── utils/
│       └── posts.js                      # 博文加载与排序通用辅助函数
├── docs/                                 # 伴随式系统文档库
│   ├── ARCHITECTURE.md                   # 系统架构说明
│   ├── COMPONENTS.md                     # 核心组件规范与微交互设计
│   ├── DESIGN_TOKENS.md                  # 设计变量与色彩语义规范
│   ├── TYPOGRAPHY_AND_STYLE_GUIDE.md     # 排版与编写全量活范例指南
│   └── handoff.md                        # 本交接指南
├── .github/workflows/deploy.yml          # GitHub Actions 自动化部署流水线
├── astro.config.mjs                      # Astro 构建配置与 Rehype 插件装载
├── CHECKLIST.md                          # 核心功能三态门禁追踪表
├── package.json                          # 项目依赖配置
└── README.md                             # 仓库主说明文档
```

---

## 4. 关键功能与核心交互机制

接手维护时，请重点关注以下核心交互与业务机制，避免反向退化：

### 4.1 代码块与引用块长块折叠机制
- **触发折叠阈值**：**14 行**。代码块（`lines.length > 14`）和长引用块（`estimatedLines > 14`）才会触发折叠；低于 14 行的长块直接完整展示，不打断短代码阅读。
- **折叠后高度**：**固定 7 行**（`Math.round(lh * 7 + padTop)`，约为 250px~257px），与原站 kenshelter.com 像素级一致。
- **设计铁律**：「触发折叠阈值 (14行)」必须严格大于「折叠后高度 (7行)」，确保读者点击展开时能够一次性多展开 7 行以上的内容，展开体验有实质收益。
- **暗色模式边框修复**：已彻底剔除 `:after` 伪元素上的假边框，统一由外部 `pre` / `blockquote` 容器承载 1px 细边框，杜绝次像素双层框与折角白边；遮罩采用通透的低饱和平滑多段渐变（`0% 透明 -> 28% 半透 -> 78% 高透 -> 100% 实底`）。

### 4.2 文件资产下载卡片组件 (`.file-asset-card`)
- **苹果 AirDrop 风格双行排版**：
  - **左侧**：46x46px 莫兰迪微色底衬（按格式分别着色），内置折角文件 SVG 与格式徽标；
  - **中间**：第一行为大粗体文件名（支持中文自定义大标题）；第二行为清爽的副标格式与物理大小（如 `PDF 文档 · 469 B`）；
  - **右侧**：药丸胶囊下载按钮（下箭头悬停轻弹 +「下载」字样）；
  - **无障碍与原生体验**：整张卡片语义化为带有 `download` 属性的 `<a>` 标签，点击整卡任意位置或右侧按钮均可触发原生文件下载。
- **编译期全自动探测引擎**：
  - 静态编译时由 `src/plugins/rehype-blog-content.mjs` 调用 Node.js `fs.statSync` 瞬间读取物理文件大小，支持 `B / KB / MB / GB` 智能换算；
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

### 5.1 撰写与发布新文章
1. 在 `posts/` 目录下新建 Markdown 文件，命名格式建议为 `YYYY-MM-DD-your-slug.md`；
2. 顶部必须包含标准 YAML Frontmatter：
   ```yaml
   ---
   title: "文章标题"
   description: "文章摘要，用于首页卡片和文章副标题展示"
   date: 2026-11-15
   cover: "/images/your-cover-image.avif" # 可选，建议比例 2:1
   category: "日常"                      # 可选分类: 学习 / 博客站 / 日常 / UP主推荐 等
   words: 2500                          # 可选，显式指定或由系统自动计算
   ---
   ```
3. 正文内部一律由二级标题 `##` 开始，**严禁在正文中使用一级标题 `#`**。

### 5.2 上传附件与在文章中引用
1. 将需要供读者下载的文件（PDF、ZIP、EPUB 等）放入 **`public/files/`** 目录：
   ```text
   public/files/my-guide.pdf
   ```
2. 在 Markdown 中**独占单行**写下引用：
   ```markdown
   [my-guide.pdf](/files/my-guide.pdf)
   ```
   或者使用自定义中文大标题：
   ```markdown
   [拔牙术后全周期护理指南](/files/my-guide.pdf)
   ```
3. 编译时系统会自动获取文件大小并生成双行拟物下载卡片，无需任何额外配置。

### 5.3 本地开发与调试
在项目根目录下通过 NixOS 环境运行命令：
```bash
# 启动本地实时热重载开发服务器 (默认端口 http://localhost:4321)
nix-shell -p nodejs pnpm --run "pnpm start"
```

### 5.4 静态编译与本地验证
在提交前必须执行静态全量构建，确保 0 报错：
```bash
# 执行 Astro 静态打包 (生成物位于 dist/)
nix-shell -p nodejs pnpm --run "pnpm build"

# 本地预览编译后的真实静态站点
nix-shell -p nodejs pnpm --run "pnpm preview"
```

### 5.5 Git 提交与推送规范
1. **核验 Git 身份**：
   ```bash
   git config user.name   # 应输出 f10w-0x00
   git config user.email  # 应输出 f10w.0x00@gmail.com
   ```
2. **规范提交并使用代理推送**：
   ```bash
   git add -A
   git commit -m "feat/fix/docs: 描述修改内容"
   http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897 git push origin main
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

1. **不要在 `src/styles/global.css` 中直接破坏 Design Tokens**：
   全站所有颜色均收敛在 `:root`、`html[data-theme=dark]` 与 `html[data-theme=light]` 中（如 `--bg`、`--surface`、`--accent`、`--code-bg`）。改动样式时请复用 Token 或使用 `color-mix(in srgb, ...)`，切忌写死十六进制颜色。
2. **长块折叠高度不可随意调小**：
   折叠后高度当前为展示 7 行（约 250px~257px），触发行数阈值不可低于 14 行，否则会再次导致展开后只增加 1~2 行的尴尬体验。
3. **外链 Favicon 自动注入白名单**：
   若需扩展外部链接的 Favicon 图标，请将 16x16 / 32x32 图标放入 `public/favicons/external-links/`，并在 `src/plugins/rehype-blog-content.mjs` 中的 `faviconMap` 登记对应域名。
4. **下载卡片单行独占要求**：
   Markdown 中的文件下载链接必须是所在 `<p>` 标签的唯一有效子元素（即前后换行独占一行）。若将链接写在正文句号中间，系统会智能将其作为正文普通行内链接处理，不会破坏自然段落流。

---

## 8. 关联参考文档

- [README.md](file:///home/flynn/Documents/Blog/README.md)：仓库基础说明与写作速查表
- [docs/ARCHITECTURE.md](file:///home/flynn/Documents/Blog/docs/ARCHITECTURE.md)：系统底层架构与技术选型
- [docs/COMPONENTS.md](file:///home/flynn/Documents/Blog/docs/COMPONENTS.md)：组件 DOM 骨架与客户端交互规范
- [docs/DESIGN_TOKENS.md](file:///home/flynn/Documents/Blog/docs/DESIGN_TOKENS.md)：莫兰迪色彩体系与设计参数
- [docs/TYPOGRAPHY_AND_STYLE_GUIDE.md](file:///home/flynn/Documents/Blog/docs/TYPOGRAPHY_AND_STYLE_GUIDE.md)：博客全量排版与写作活范例
- [CHECKLIST.md](file:///home/flynn/Documents/Blog/CHECKLIST.md)：Feature 交付与三态门禁状态表
