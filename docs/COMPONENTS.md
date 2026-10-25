# 核心组件与交互规范 (Components & Interactions)

本文档定义当前博客站核心组件的语义化 DOM 结构、CSS 类名约束与客户端微交互机制。

---

## 1. 顶栏导航 (`BaseLayout.astro`)

### 1.1 DOM 骨架
```html
<header class="site-header">
  <div class="site-header-inner">
    <!-- 个人圆形头像 -->
    <a class="brand" href="/" aria-label="首页" title="首页">
      <img class="brand-avatar" src="/avatar.png" alt="首页" width="28" height="28" />
    </a>
    <!-- 主导航 -->
    <nav class="site-nav" aria-label="主导航">
      <a href="/" aria-current="page">首页</a>
      <a href="/blog/">文档</a>
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
- **高度**：固定 `44px`，顶部保持安全留白。
- **毛玻璃效果**：`backdrop-filter: saturate(180%) blur(20px)`，半透明背景与页面内容无缝融合。
- **高亮态**：`aria-current="page"` 时呈现柔和背景色（`--bg-soft`）与加粗字重。

---

## 2. 网站设置抽屉与分段控制器 (`main.js`)

### 2.1 偏好项目
- **外观**：自动（跟随系统） / 浅色 / 深色。支持 View Transitions 平滑扫光过渡动效。
- **字号**：S (16px) / M (17.5px) / L (19px)。
- **版心宽度**：S (窄) / M (中) / L (宽)。

### 2.2 分段控制器 (Segmented Control)
采用类似 iOS 的圆角滑动胶囊，通过 `data-active-index` 驱动纯 CSS 硬件加速位移：
```css
.segmented-control:before {
  transform: translate(var(--segmented-thumb-offset));
  transition: transform .26s cubic-bezier(.22, 1, .36, 1);
}
```

---

## 3. 文档归档筛选与 60° 旋转等边三角形 (`src/pages/blog/index.astro`)

### 3.1 核心状态
- **类型筛选**：根据文章 frontmatter 中的 `category` 聚合计数，支持 URL 参数联动（`?category=...`）。
- **年份筛选**：按发布年份过滤，支持 URL 参数联动（`?year=...`）。
- **正反序切换**：采用等边三角形几何对称旋转：
```css
.archive-sort-triangle {
  width: 10px;
  height: 10px;
  transform: rotate(var(--sort-triangle-rotation, 180deg));
  transition: transform .22s cubic-bezier(.2, .8, .2, 1);
}
```
每次点击顺时针旋转 60°，实现优雅的几何倒置反转。

---

## 4. 已读博文打勾指示器 (`post-card-visited-icon`)

### 4.1 行为规范
- **显示范围**：仅在文档归档列表页（`/blog/`）与文章底部的同分类推荐列表中展示。首页（Recent Posts）保持干净不显示。
- **存储机制**：使用 `localStorage['KenShelter-visited-posts']` 存储已读的文章 slug。
- **触发时机**：
  1. 点击列表链接跳转时即刻存入并点亮；
  2. 访问文章详情页时自动记录；
  3. 监听浏览器 `pageshow` 事件（后退时 BFCache 恢复）自动同步最新打勾状态。
- **图标结构**：
```html
<span class="post-card-visited-icon post-visited-icon" data-post-visited-icon aria-hidden="true">
  <svg viewBox="0 0 24 24" focusable="false"><path d="m3.5 11.5 5.5 5.5L20 6"></path></svg>
</span>
```

---

## 5. 代码块与长引用块渐隐折叠机制

### 5.1 触发行数规则
- **代码块**：文本行数超过 16 行（`lines.length > 16`）时触发自动折叠。
- **引用块**：计算高度超过 16 行（`Math.ceil(scrollHeight / lineHeight) > 16`）时触发自动折叠。

### 5.2 渐隐遮罩与零残影密封规范
- **展示高度**：折叠状态下展示约 8.2 行（`lh * 8.2 + padTop`），移除底部 padding 干扰，阻断未展示行流入可视边缘。
- **蒙层定位**：`position: absolute; right: 0; bottom: 0; left: 0; z-index: 2;`。
- **边框吻合**：蒙层三边（底边、左边、右边）自带与容器颜色像素级契合的 1px 边框，消除浏览器在次像素缩放时的漏光与断痕。
- **实色渐变底**：自 65% 起渐变为 100% 不透明实色纯底，遮盖力坚实自然。
- **展开热区**：整个底部遮罩区域（`.collapsible-block-reveal`）均可点击一键展开。
