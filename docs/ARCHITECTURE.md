# 系统架构设计说明 (Architecture)

## 1. 技术栈选型

- **核心框架**：[Astro 5.x](https://astro.build/) (静态生成模式 `output: 'static'`)
  - **极致扁平化架构**：博客文章统一收敛在根目录 `posts/*.md`，无需手写繁杂的静态 HTML 页面。
  - **全局纯净样式**：直接采用现代原生 CSS 与高精度 Design Tokens（莫兰迪色系、苹果极简语义），零预设样式污染。
  - **集中式 Vanilla 交互引擎**：统一在 `src/scripts/main.js` 中驱动全站核心交互（设置抽屉平滑滑块、已读博文本地打勾、代码块一键复制、BFCache 同步）。
  - **编译管道**：挂载自定义 Rehype 编译器插件 (`src/plugins/rehype-blog-content.mjs`)，在编译阶段自动转换 Callout 提示框、图片懒加载图注、外链 Favicon，以及**编译期自动探测 `public/files/` 附件大小与格式并生成高保真下载卡片**。
- **运行与构建环境**：
  - 标准 Node.js（22+）+ `pnpm@10.5.2`（可通过 `corepack pnpm` 或 NixOS `nix-shell -p nodejs pnpm` 使用）。

---

## 2. 工程目录拓扑

```text
.
├── posts/                        # 核心博文目录（唯一正文写作源，标准 Markdown 格式）
├── docs/                         # 系统核心设计与写作规范指南
│   ├── ARCHITECTURE.md           # 架构设计说明（本文档）
│   ├── DESIGN_TOKENS.md          # 视觉设计 Token 规范（色板、字体、断点）
│   ├── COMPONENTS.md             # 核心组件规范与微交互逻辑
│   ├── TYPOGRAPHY_AND_STYLE_GUIDE.md # 博客全量排版与写作指南
│   └── handoff.md                # 项目交接与维护指南
├── public/                       # 静态资源
│   ├── avatar.png                # 网站个人头像
│   ├── favicon.png / favicon.ico # 浏览器 Favicon
│   ├── files/                    # 附件下载资源（PDF、ZIP 等，由编译器自动读取体积）
│   ├── fonts/                    # 自托管 Web 字体 (Anthropic Sans)
│   ├── favicons/                 # Apple Touch Icon 与站外链接 Favicon 资源
│   └── images/                   # 博文正文配图与封面图
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # 全局主容器、防闪烁设置初始化、顶栏 Header 与设置抽屉
│   ├── pages/
│   │   ├── index.astro           # 首页（Recent Posts 卡片流，无已读小勾干扰）
│   │   ├── blog/
│   │   │   ├── index.astro       # 文档归档页（分类/年份过滤、60° 旋转排序、已读打勾）
│   │   │   └── [slug].astro      # 动态文章页（Markdown 渲染、图注、分类导航、相邻翻页）
│   │   └── rss.xml.js            # RSS 2.0 订阅源生成器（含 XML/CDATA 安全转义）
│   ├── plugins/
│   │   └── rehype-blog-content.mjs # 编译器插件（下载卡片、图注 Figure、Callout、外链 Favicon）
│   ├── scripts/
│   │   └── main.js               # 客户端主交互脚本（设置、复制、已读标记）
│   ├── styles/
│   │   └── global.css            # 统一样式系统（已剔除无用遗留样式并格式化）
│   └── utils/
│       └── posts.js              # 统一博文加载（getAllPosts）、日期兜底与自动字数统计
├── astro.config.mjs              # Astro 配置文件
├── package.json
└── tsconfig.json
```

---

## 3. 部署与维护

```bash
# 安装依赖
pnpm install

# 启动本地开发服务 (默认端口 4321)
pnpm dev

# 生产环境静态打包 (产物位于 dist/)
pnpm build

# 本地预览构建产物
pnpm preview
```
