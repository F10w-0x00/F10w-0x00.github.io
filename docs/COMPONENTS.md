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

### 5.1 触发行数与折叠高度原则
- **触发折叠阈值**：超过 14 行时触发折叠（代码块 `lines.length > 14`，引用块 `estimatedLines > 14`）。
- **折叠后高度**：展示 7 行内容（`Math.round(lh * 7 + padTop)`，高度约为 250px~257px），与原站 kenshelter.com 保持像素级一致。
- **核心体验设计**：「触发折叠的高度阈值」必须大于「折叠后的高度」（14 行 > 7 行），使读者点击展开时能够展开至少 7 行以上的内容，带来清晰明确的阅读与交互正收益。

### 5.2 轻盈通透渐变遮罩规范
- **蒙层定位**：`position: absolute; right: 0; bottom: 0; left: 0; z-index: 2; height: 148px; pointer-events: none;`。
- **纯粹外框承载**：完全剥离 `:after` 伪元素边框，由外层容器直接承载 1px 细边框，彻底杜绝暗色模式下的内缩双层框与白亮折角异常。
- **多段平滑过渡**：采用原站同款低饱和渐变曲线（`0% 透明 -> 28% (60%浓度) -> 78% (90%浓度) -> 100% 完全遮盖`），代码字迹柔和淡出，通透自然。
- **展开热区**：整个底部遮罩区域（`.collapsible-block-reveal`）均可点击一键展开。

---

## 6. 文件资产下载卡片组件 (`.file-asset-card`)

### 6.1 设计规格（方案 1.1 双行经典苹果 AirDrop 风格）
- **布局模型**：三列网格（`46px minmax(0, 1fr) auto`），大圆角与莫兰迪低饱和度背景。
- **左侧图标**：46x46px 莫兰迪微色底衬（按 PDF、ZIP、EPUB 等类型分别着色），内置折角文件 SVG 与格式小徽标。
- **中间信息**：
  - 第一行：主标题（粗体，大字号，支持自定义中文标题或文件名）；
  - 第二行：副标元信息（`PDF 文档 · 2.4 MB`，编译期通过 `fs.statSync` 自动读取物理字节并友好换算）。
- **右侧交互**：药丸胶囊下载按钮（带下箭头 SVG 与「下载」字样），整卡及按钮均支持点击触发原生下载（带 `download` 属性）。
- **微交互**：整卡悬停微浮（`translateY(-1.5px)`），胶囊按钮反色高亮，箭头轻微下弹（`translateY(1.5px)`）。
