# 系统架构设计说明 (Architecture)

## 1. 技术栈选型

- **核心框架**：[Astro 5.x](https://astro.build/) (静态生成模式 `output: 'static'`)
  - **极致扁平化架构**：博客文章统一收敛在根目录 `posts/*.md`，无需手写繁杂的静态 HTML 页面。
  - **全局纯净样式**：直接采用现代原生 CSS 与高精度 Design Tokens（莫兰迪色系、苹果极简语义），零预设样式污染。
  - **集中式 Vanilla 交互引擎**：统一在 `src/scripts/main.js` 中驱动全站核心交互（设置抽屉平滑滑块、已读博文本地打勾、代码复制与长块渐隐折叠、BFCache 同步）。
  - **编译管道**：挂载自定义 Rehype 编译器插件 (`src/plugins/rehype-blog-content.mjs`)，在编译阶段自动转换 Callout 提示框、图片懒加载图注与外链 Favicon。
- **运行与构建环境**：
  - 基于 NixOS 声明式环境，统一由 `nix-shell -p nodejs pnpm git` 提供底层支撑。

---

## 2. 工程目录拓扑

```text
/home/flynn/Documents/Blog/
├── posts/                        # 核心博文目录（唯一正文写作源，标准 Markdown 格式）
│   ├── 2026-06-10-visual-and-interaction-design-of-this-blog-site.md
│   ├── 2026-07-20-my-wisdom-tooth-extraction-experience.md
│   ├── 2026-07-25-recommended-up-creators-im-following-part-3.md
│   └── 2026-10-01-how-i-use-obsidian.md
├── docs/                         # 系统核心设计与写作规范指南
│   ├── ARCHITECTURE.md           # 架构设计说明（本文档）
│   ├── DESIGN_TOKENS.md          # 视觉设计 Token 规范（色板、字体、断点）
│   ├── COMPONENTS.md             # 核心组件规范与微交互逻辑
│   └── TYPOGRAPHY_AND_STYLE_GUIDE.md # 博客全量排版与写作指南
├── public/                       # 静态资源
│   ├── avatar.png                # 网站个人头像
│   ├── favicon.png / favicon.ico # 浏览器 Favicon
│   ├── fonts/                    # 自托管 Web 字体 (Anthropic Sans)
│   ├── favicons/external-links/  # 站外链接自动注入的 Favicon 资源
│   └── images/                   # 博文正文配图
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # 全局主容器、防闪烁设置初始化、顶栏 Header
│   ├── pages/
│   │   ├── index.astro           # 首页（Recent Posts 卡片流，无已读小勾干扰）
│   │   ├── blog/
│   │   │   ├── index.astro       # 文档归档页（分类/年份过滤、60° 旋转排序、已读打勾）
│   │   │   └── [slug].astro      # 动态文章页（Markdown 渲染、图注、分类导航、相邻翻页）
│   │   └── rss.xml.js            # RSS 订阅源生成器
│   ├── plugins/
│   │   └── rehype-blog-content.mjs # 编译器插件（Callout、图注 Figure、外链 Favicon）
│   ├── scripts/
│   │   └── main.js               # 客户端主交互脚本（设置、折叠、复制、已读标记）
│   ├── styles/
│   │   └── global.css            # 统一样式系统（变量、暗黑模式、Prose 排版）
│   └── utils/
│       └── posts.js              # 博文元数据解析与排序辅助函数
├── astro.config.mjs              # Astro 配置文件
├── package.json
└── tsconfig.json
```

---

## 3. 部署与维护

```bash
# 启动本地开发服务 (默认端口 4321)
nix-shell -p nodejs pnpm --run "pnpm dev"

# 生产环境静态打包 (产物位于 dist/)
nix-shell -p nodejs pnpm --run "pnpm build"

# 本地预览构建产物
nix-shell -p nodejs pnpm --run "pnpm preview"
```
