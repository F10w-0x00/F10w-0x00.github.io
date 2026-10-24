# Design Tokens Specification (设计系统参数规范)

> 本规范基于逆向工程原站（`https://kenshelter.com/`）样式表 `BaseLayout.BXLOwkA9.css` 及原站设计长文《本博客站的视觉和交互设计》精确解析提取。

---

## 1. 字体栈系统 (Typography Stack)

### 1.1 正文字体栈 (Sans-Serif / Prose)
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro SC", "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif;
```
- **基准字号**：`--site-font-size: 17.5px;`
- **正文行高**：`line-height: 1.8;`
- **渲染平滑**：`-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;`

### 1.2 等宽代码字体栈 (Monospace)
```css
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

---

## 2. 标题层级字号与行高阶梯 (Headings Scale)

| 标签 | 字号公式 (`clamp`) | 行高 (`line-height`) | 字重 (`font-weight`) | 边距 (`margin`) |
| :--- | :--- | :--- | :--- | :--- |
| **H1 (页面主标题)** | `clamp(2.75rem, 8vw, 5.4rem)` | `1.04` | 760 | `0 0 16px` |
| **H1 (Prose 文章)** | `clamp(2rem, 4vw, 2.75rem)` | `1.04` | 760 | `max(1.95rem, 1em) 0 1.95rem` |
| **H2 (二级小节)** | `clamp(1.55rem, 3.2vw, 1.95rem)` | `1.22` | 720 | `2.4rem 0 1rem` |
| **H3 (三级小节)** | `clamp(1.35rem, 3vw, 1.65rem)` | `1.3` | 680 | `1.8rem 0 0.8rem` |
| **H4 (四级小节)** | `clamp(1.2rem, 2.5vw, 1.35rem)` | `1.4` | 640 | `1.4rem 0 0.6rem` |
| **H5 (五级小节)** | `clamp(1.08rem, 2vw, 1.16rem)` | `1.45` | 600 | `1.2rem 0 0.5rem` |

---

## 3. 全局色彩语义系统 (Morandi Palette & Semantic Tokens)

站点贯彻“莫兰迪色系”与“苹果极简黑白灰”结合的审美理念。**色彩具有不可违背的明确语义约束**：
- **蓝色** (`--link-internal`)：专属于**站内语义**（所有站内跳转、当前选中分类、锚点悬停指示、页面内跳转小箭头）。
- **棕色** (`--link-external`)：专属于**站外语义**（所有跳出外部链接均强制采用棕色、保留下划线、并自动附加外链 Favicon 图标）。

### 3.1 亮色模式 (Light Theme)
```css
:root, [data-theme="light"] {
  --bg: #ffffff;
  --bg-soft: #f5f5f7;
  --bg-softer: #fbfbfd;
  --surface: #ffffff;
  --surface-tint: #f2fbfd;
  --text: #1d1d1f;
  --muted: #6e6e73;
  --muted-strong: #424245;
  --border: #d2d2d7;
  --border-soft: rgba(0, 0, 0, .08);
  --accent: #8f8f94;
  --accent-strong: #5f6065;
  --accent-soft: #f0f0f2;
  
  /* 语义化色彩 */
  --link-internal: #416fae;       /* 站内链接专享 Morandi 蓝 */
  --link-external: #a77763;       /* 站外链接专享 Morandi 棕 */
  
  /* 代码块色彩 */
  --code-accent: #6f8f98;
  --inline-code-text: #3f626b;
  --code-soft: #eef4f5;
  --code-bg: #f6f7f8;
  --code-text: #24292f;
  --code-muted: #57606a;
  
  /* 引用块色彩 */
  --quote-accent: #8b8198;
  --quote-soft: #f4f1f6;
  
  /* 评论与提示高亮色彩 */
  --comment-accent: #fec37d;
  --comment-accent-strong: #e87516;
  
  /* 阴影 Token */
  --floating-panel-shadow: 0 22px 70px rgba(0, 0, 0, .18), 0 8px 22px rgba(0, 0, 0, .1);
  --shadow-soft: 0 18px 50px rgba(0, 0, 0, .08);
  --shadow-hover: 0 26px 70px rgba(95, 96, 101, .14);
}
```

### 3.2 深色模式 (Dark Theme)
```css
[data-theme="dark"] {
  --bg: #111315;
  --bg-soft: #1a1d20;
  --bg-softer: #15181b;
  --surface: #1d1d1f;
  --surface-tint: #0f252a;
  --text: #f5f5f7;
  --muted: #a1a1a6;
  --muted-strong: #d2d2d7;
  --border: #3a3a3c;
  --border-soft: rgba(255, 255, 255, .12);
  --accent: #b8b8bd;
  --accent-strong: #e0e0e4;
  --accent-soft: #303033;
  
  /* 语义化色彩 */
  --link-internal: #9fc2f2;       /* 深色下低饱和微亮蓝 */
  --link-external: #d4a08d;       /* 深色下暖色莫兰迪棕 */
  
  /* 代码块色彩 */
  --code-accent: #a7c2ca;
  --inline-code-text: #a7c2ca;
  --code-soft: #1e2d31;
  --code-bg: #0d1117;
  --code-text: #e6edf3;
  --code-muted: #8b949e;
  
  /* 引用块色彩 */
  --quote-accent: #c3b6d0;
  --quote-soft: #2a2530;
  
  /* 评论与提示高亮色彩 */
  --comment-accent: #fec37d;
  --comment-accent-strong: #fec37d;
  
  /* 阴影 Token */
  --floating-panel-shadow: 0 28px 82px rgba(0, 0, 0, .62), 0 10px 28px rgba(0, 0, 0, .42);
  --shadow-soft: 0 20px 60px rgba(0, 0, 0, .36);
  --shadow-hover: 0 28px 80px rgba(184, 184, 189, .14);
}
```

---

## 4. 容器与栅格系统 (Layout & Metrics)

```css
:root {
  --site-edge-space: clamp(14px, 3vw, 32px);
  --content-gutter: clamp(16px, 4vw, 56px);
  --content-width: clamp(980px, 84vw, 1240px);
  --article-gutter: var(--content-gutter);
  --article-width: clamp(760px, 65vw, 960px);
  --site-header-height: 44px;
  
  /* 圆角层级 */
  --radius-lg: 34px;
  --radius-md: 24px;
  --radius-sm: 16px;
}

@media (max-width: 768px) {
  :root {
    --site-edge-space: 14px;
    --site-header-height: 42px;
  }
}

html[data-page="home"],
html[data-page="blog-index"] {
  --content-width: 960px;
}
```

---

## 5. 微交互与动画参数 (Transitions & Curves)

- **通用过渡曲线**：`transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);`（Apple iOS / macOS 物理回弹缓动）
- **常规微交互耗时**：`160ms ~ 240ms`
- **主题切换过度**：`color 200ms ease, background-color 200ms ease, border-color 200ms ease`
- **等边三角形排序翻转**：`transform: rotate(60deg); transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1);`
- **沉浸式大纲聚拢动画**：`opacity 300ms ease, transform 350ms cubic-bezier(0.16, 1, 0.3, 1)`
- **代码/引用折叠阈值**：
  - 触发折叠阈值：`max-height: 420px;`
  - 折叠后显示高度：`max-height: 280px;`
  - 渐隐蒙层高度：`120px` 线性渐变（`to bottom, transparent, var(--bg)`）
