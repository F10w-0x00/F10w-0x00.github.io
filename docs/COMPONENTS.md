# 核心组件架构规范 (Components Specification)

本文档定义项目中所有核心组件的语义化 DOM 结构、CSS 类名约束与微交互接口规范。

---

## 1. 全局导航组件 (`SiteHeader.astro`)

### 1.1 DOM 骨架
```html
<header class="site-header">
  <div class="site-header-inner">
    <a class="brand" href="/" aria-label="首页">Ken’s Shelter</a>
    <nav class="site-nav" aria-label="主导航">
      <a href="/">首页</a>
      <a href="/blog/" aria-current="page">文档</a>
      <a href="/products/">产品</a>
    </nav>
    <div class="site-header-actions">
      <!-- 锚点返回按钮 (内部同页跳转后出现) -->
      <button class="anchor-return-button" type="button" data-anchor-return hidden aria-label="回到跳转前的位置">
        <svg viewBox="0 0 24 24"><path d="M9.25 5.75 4.75 10.25l4.5 4.5"/><path d="M5.25 10.25h8.8a5.2 5.2 0 0 1 5.2 5.2v2.8"/></svg>
      </button>
      <!-- 网站设置按钮 -->
      <button class="settings-button" type="button" data-settings-toggle aria-label="打开网站设置">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="..."/></svg>
      </button>
    </div>
  </div>
</header>
```

### 1.2 关键样式与状态
- 高度：桌面端 `44px`，移动端 `42px`。
- 背景：支持半透明毛玻璃 `backdrop-filter: blur(16px)`，与背景色自然融合。
- 激活态：`aria-current="page"` 时标题色高亮。

---

## 2. 博客列表项卡片 (`PostCard.astro`)

### 2.1 DOM 骨架
```html
<article class="post-card" data-post-id="{id}">
  <a href="/blog/{slug}/" class="post-card-link">
    <div class="post-card-body">
      <h2>
        <span class="post-card-visited-icon" data-post-visited-icon aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m3.5 11.5 5.5 5.5L20 6"/></svg>
        </span>
        <span class="post-card-title-text">{title}</span>
      </h2>
      <div class="post-card-footer">
        <p class="post-meta post-card-meta">
          <time datetime="{isoDate}">{formattedDate}</time>
          <span aria-hidden="true">/</span>
          <span>{wordCount} 字</span>
        </p>
      </div>
    </div>
    {cover && (
      <div class="post-card-cover" aria-hidden="true">
        <img src="{cover}" alt="" width="640" height="320" loading="lazy" decoding="async" />
      </div>
    )}
  </a>
</article>
```

---

## 3. 沉浸式大纲与文章布局 (`PostLayout.astro`)

### 3.1 核心状态逻辑
- 默认状态：阅读模式（Safari 阅读模式对称版心，文字宽度固定在最佳视觉跨度）。
- 大纲触发：点击任意正文小标题（`h2`, `h3`），触发 `toggleImmersiveOutline()`。
- 动画表现：
  1. 正文段落（`p`, `pre`, `blockquote`, `table` 等）设置 `opacity: 0; pointer-events: none;`。
  2. 标题元素平滑聚集移动，重排为大纲目录树。
  3. 点击任意标题跳转并退出大纲视图，正文平滑渐入。

---

## 4. 排序按钮与 60° 旋转等边三角形 (`SortButton.astro`)

### 4.1 几何动效原理
采用正三角形（`polygon(50% 0%, 0% 100%, 100% 100%)`）。正三角形具备 3 阶旋转对称性，旋转 60° 即可形成完美的几何反转视觉效果：
```css
.sort-triangle {
  width: 10px;
  height: 9px;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  background-color: var(--muted);
  transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sort-button[data-order="asc"] .sort-triangle {
  transform: rotate(60deg);
}
```

---

## 5. 外链自动 Favicon 与高阶排版组件

- **站外链接**：强制赋予 class `external-link-with-favicon`，并在内部挂载 `<img class="external-link-favicon" src="..." />`，字体采用 `--link-external` 莫兰迪棕色。
- **长代码与引用折叠**：检测子节点高度，超过 `420px` 时增加 `.is-collapsible`，展示渐变背景遮罩与展开按钮。
