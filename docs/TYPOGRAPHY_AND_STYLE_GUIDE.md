# 博客排版与内容编写全量规范指南 (Typography & Style Guide)

> 本文档由系统自动化生成并已实装至博客站。本文不仅是技术文档，更是一份**全特性的排版活范例**。在日常撰写文章时，可直接参考或复制文中的模板代码。

---

## 目录
1. [文章 Frontmatter 元数据规范](#1-文章-frontmatter-元数据规范)
2. [正文结构与层级规范](#2-正文结构与层级规范)
3. [文本格式与中英文混排（盘古之白）](#3-文本格式与中英文混排盘古之白)
4. [超链接系统：站内蓝链与外链 Favicon](#4-超链接系统站内蓝链与外链-favicon)
5. [图片排版与图片下方小字说明（Caption）](#5-图片排版与图片下方小字说明caption)
6. [多图轮播堆叠（Image Carousel）](#6-多图轮播堆叠image-carousel)
7. [代码块高保真系统（Shiki 语法高亮、语言徽标与折叠）](#7-代码块高保真系统shiki-语法高亮语言徽标与折叠)
8. [引用块与注意事项（Callout）](#8-引用块与注意事项callout)
9. [表格排版与列宽策略](#9-表格排版与列宽策略)
10. [字体系统深度解析与自选字体指南](#10-字体系统深度解析与自选字体指南)

---

## 1. 文章 Frontmatter 元数据规范

博客中的每篇文档都应当具备标准的 YAML Frontmatter，用于控制标题、摘要、归档类型、发布时间及社交媒体分享元数据：

```yaml
---
title: "我是怎么使用 Obsidian 的"
description: "Obsidian 的哲学和缺陷，双链笔记与本地知识库构建"
date: 2026-10-01
category: "学习" # 可选: 学习 / 博客站 / 日常 / UP主推荐
words: 2994
cover: "/images/814A9B04-173E-4FFE-AD5C-2A06884329B5-thumb.C1EMAMs5.avif"
---
```

### 字段说明表
| 字段 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `title` | `string` | 必填 | 网页标题与卡片主标题，控制在 30 字以内最佳。 |
| `description` | `string` | 必填 | 用于归档卡片正文摘录及 `<meta name="description">`。 |
| `date` | `date / string` | 必填 | 格式为 `YYYY-MM-DD`，排序引擎以此为时间戳依据。 |
| `category` | `string` | 推荐 | 文档页分类过滤器（按类型筛选）的聚合依据。 |
| `words` | `number` | 推荐 | 正文字数统计（如 2994），展示为 "2994 字"。 |
| `cover` | `string` | 可选 | 列表卡片与文章头图（如 `/images/...`），建议比例 `2:1`。 |

---

## 2. 正文结构与层级规范

- **h1（一级标题）**：通常已被模版用于渲染文章主标题。正文内部**不要**使用一级标题。
- **h2（二级标题）**：篇章主核心章节，例如 `## 哲学基石：本地优先`。
- **h3（三级标题）**：章节下的小专题，例如 `### 卡片盒笔记法的改良`。
- **h4（四级标题）**：细微步骤或补充说明。

---

## 3. 文本格式与中英文混排（盘古之白）

1. **盘古之白**：中文与英文、中文与数字之间，建议保留一个半角空格，例如：`使用 Astro 和 Tailwind` 而非 `使用Astro和Tailwind`。
2. **强调与删除线**：
   - 粗体：`**核心观点**` -> 呈现加粗深色文字。
   - 斜体：`*专有名词*` -> 呈现倾斜体。
   - 删除线：`~~过时论点~~` -> 呈现贯穿删除线。
3. **内联代码（Inline Code）与一键复制**：
   - 使用单个反引号包裹：`` `const site = "f10w-0x00";` ``。
   - **交互特性**：正文中的内联代码内置了 `data-copy-ready` 复制能力，读者在桌面上点击即可静默复制内容至剪贴板，并呈现绿色对勾反馈！

---

## 4. 超链接系统：站内蓝链与外链 Favicon

博客站对超链接做了严密的视觉语义设计：

### 4.1 站内链接（蓝链）
指向站内其他文档或同页锚点的链接为蓝色：
```html
<a href="/blog/2026-06-10-visual-and-interaction-design-of-this-blog-site/" data-link-reading-kind="internal">本博客站的视觉和交互设计</a>
```
当点击同页锚点（例如 `<a href="#section-1" class="same-page-anchor-with-indicator">`）时，顶栏会自动浮现返回按钮，点击后平滑滚动回跳转前的位置。

### 4.2 外部链接（棕链 + Favicon）
指向外网的链接统一为莫兰迪棕色，并带有外链专属图标：
```html
<a href="https://obsidian.md" target="_blank" rel="noopener noreferrer" class="external-link-with-favicon" data-link-reading-kind="external">
  <img src="/favicons/external-links/obsidian-md.ico" alt="" class="external-link-favicon" width="16" height="16" loading="lazy" decoding="async" aria-hidden="true">
  Obsidian 官网
</a>
```

---

## 5. 图片排版与图片下方小字说明（Caption）

### 5.1 如何在图片下写小字说明（重点）

在博客中，有三种方式为图片添加精致、居中且带微灰度的说明小字：

#### 方式一：语义化 HTML 标签（100% 还原原版视觉，推荐）
原版博客的样式系统直接为 `<figure class="post-image-figure">` 和 `<figcaption class="post-image-caption">` 提供了像素级对齐规则：
```html
<figure class="post-image-figure">
  <img
    src="/_astro/Screenshot%202026-06-09%20at%2014.19.30@2x-thumb.DkFLZDcN_2khIvz.avif"
    alt="Obsidian 网状关系图谱"
    loading="lazy"
    decoding="async"
    width="1024"
    height="576"
  />
  <figcaption class="post-image-caption">Obsidian 网状关系图谱：过早编织的复杂网状图往往沦为视觉摆设</figcaption>
</figure>
```
- **视觉效果**：图片自适应容器，下方带有 `-2px` 负边距贴合的小字，字体为 `--muted` 灰色，字号为 `0.92rem`，多行居中。

#### 方式二：纯 Markdown 紧凑模式
若不愿编写 HTML，可在标准 Markdown 图片下方紧随一行居中斜体小字：
```markdown
![维基百科对网页侧面的占用](/_astro/Screenshot%202026-06-10%20at%2016.07.52@2x-thumb.CbthJ_iF_Z2jzm4w.avif)
<p align="center"><small style="color: var(--muted);">维基百科对网页侧面的占用：繁复的侧边配置破坏了专注感</small></p>
```

#### 方式三：图片 `data-caption` 属性（触发灯箱浮层小字）
若通过 Astro 原生脚本渲染，直接在 `<img>` 标签中写入 `data-caption`：
```html
<img src="/path/to/image.png" alt="说明文字" data-caption="展开全屏后在底部药丸浮层显示的标题小字" />
```
前端 JS 会在页面就绪时将其自动包装为支持点击放大的画廊容器。

---

## 6. 多图轮播堆叠（Image Carousel）

当一个 `<p>` 标签中包含连续两张或多张图片时，系统会自动激活交互式堆叠轮播组件：
```html
<p>
  <img alt="Saral Theme 的 demo" data-caption="Saral Theme 的 demo" src="/_astro/Screenshot%202026-06-09%20at%2014.05.08@2x-thumb.n6G8qpch_2a1Atg.avif" />
  <img alt="我的博客站首页" data-caption="我的博客站首页" src="/_astro/Screenshot%202026-06-09%20at%2014.06.20@2x-thumb.DIo6n6gp_1dAbs5.avif" />
</p>
```
用户点击翻页箭头时，图片具备带有物理弹性的拟物翻页卡片堆叠动画，并支持全屏灯箱浏览。

---

## 7. 代码块高保真系统（Shiki 语法高亮、语言徽标与折叠）

代码块严格对齐原站规格，具备三大特性：
1. **左上角浮动语言药丸徽章**（通过 `data-language` 或 `data-code-language` 触发）
2. **右上角圆形质感一键复制按钮**（自动读取代码纯文本，带有状态流转动画）
3. **超长代码渐隐折叠与展开交互**（超过 16 行时自动触发底部渐隐遮罩与展开按钮，展示约 8 行代码并优雅渐隐）

### 7.1 常规短代码块范例
```html
<pre class="astro-code astro-code-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" data-language="dataview"><code><span class="line"><span style="--shiki-light:#cf222e;--shiki-dark:#ff7b72;">TABLE</span> <span style="--shiki-light:#0550ae;--shiki-dark:#79c0ff;">file.mtime</span> <span style="--shiki-light:#cf222e;--shiki-dark:#ff7b72;">AS</span> <span style="--shiki-light:#0a3069;--shiki-dark:#a5d6ff;">"最后修改"</span></span>
<span class="line"><span style="--shiki-light:#cf222e;--shiki-dark:#ff7b72;">FROM</span> <span style="--shiki-light:#0a3069;--shiki-dark:#a5d6ff;">"02_Knowledge"</span></span>
<span class="line"><span style="--shiki-light:#cf222e;--shiki-dark:#ff7b72;">WHERE</span> <span style="--shiki-light:#8250df;--shiki-dark:#d2a8ff;">contains</span><span style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;">(</span><span style="--shiki-light:#0550ae;--shiki-dark:#79c0ff;">status</span><span style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;">,</span> <span style="--shiki-light:#0a3069;--shiki-dark:#a5d6ff;">"active"</span><span style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;">)</span></span></code></pre>
```

### 7.2 触发折叠的多行代码块范例（行数 > 16）
任何指定了语言且行数大于 16 行的代码块，客户端脚本将自动为外部添加 `.collapsible-code-block` 容器，渲染出半透明渐变遮罩与“展开代码块”旋钮，点击后流畅展开全部代码。短代码块（1~16 行）默认完整展示，不折叠打扰阅读。

---

## 8. 引用块与注意事项（Callout）

### 8.1 常规引用块（带紫色装饰角标）
```markdown
> 知识管理工具的最终目的不是为了展示自己“收集了多少知识”，而是为了在需要调用的时候能够快速检索，并在思考碰撞中产出自己的表达。
```

### 8.2 附言与注意事项（Callout Note）
在 Markdown 中可直接使用 GitHub Alert 语法书写：
```markdown
> [!NOTE] 附言
> 此前 Lia 就提议过注意事项的格式支持，有了注意事项后，便可在文首说明更新细节。
```

### 8.3 纯图标简短提示（Callout Icon Only）
若无需标题文本、仅保留圆形信息圆点图标：
```markdown
> [!NOTE CALLOUT-ICON-ONLY]
> 有时发炎，所以想要拔。但想到看牙医很可怕，终于拔掉后，只会感觉解脱了……
```

---

## 9. 表格排版与列宽策略

博客表格默认继承了防换行列宽策略：
```html
<table>
  <thead>
    <tr>
      <th>维度</th>
      <th>缺陷现象</th>
      <th>应对策略</th>
      <th align="right">恢复周期</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>移动端体验</td>
      <td>启动缓慢，插件过多时内存占用高</td>
      <td>移动端仅用于速记收集，定期在桌面端归档整理</td>
      <td align="right">即时</td>
    </tr>
  </tbody>
</table>
```
- 左侧列作为属性定义，自动赋予适度冗余空间以防换行；
- 数值或费用类字段建议使用 `align="right"` 靠右对齐。

---

## 10. 字体系统深度解析与自选字体指南

针对你关心的字体选择与定制方案，以下是深度专业分析与实施建议：

### 10.1 原博客究竟用的是什么字体？
查看全局编译后的样式表 `BaseLayout.BXLOwkA9.css`，原站的核心字体规则为：
```css
/* 正文全局字体栈 */
font-family: -apple-system, BlinkMacSystemFont, "SF Pro SC", "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif;

/* 代码与等宽字体栈 */
font-family: "SF Mono", Menlo, Consolas, monospace;
```
**原博客之所以阅读体验极佳，是因为它完全没有采用笨重的外部网络字体，而是使用了“无感系统原生字体栈”**：
- **Apple 生态（Mac / iPhone / iPad）**：系统自动调用 **SF Pro**（西文）与 **PingFang SC（苹方-简）**。这正是苹果官网、Safari 阅读模式的标准排版基调，字形工整、笔锋极简、灰度平衡极佳。
- **Windows 生态**：自动回退至 **Segoe UI**（西文）与 **Microsoft YaHei（微软雅黑）**。
- **等宽代码**：Mac 走 **SF Mono**，Windows 走 **Consolas**。
- **优势**：
  1. **零延迟白屏（0ms FOIT）**：无需下载几十兆的中文字体包，秒开网页。
  2. **渲染清晰度最高**：各大操作系统的字体平滑与子像素渲染引擎都是为自带字体量身定制的。

---

### 10.2 兼顾 Win 与 Mac 的默认字体方案选型

如果你希望调整整体视觉风格，推荐以下三种成熟的免下载原生字体组合：

#### 方案 A：现代冷淡极简风（原版采用，强烈推荐）
```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro SC", "SF Pro Text", "PingFang SC", "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
```
- **适用场景**：技术博客、产品设计、知识管理。
- **视觉感受**：冷淡、专注、现代、类似 Safari 阅读器。

#### 方案 B：人文阅读书卷风（系统衬线体）
```css
--font-serif: "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", "STSong", "SimSun", Georgia, Cambria, serif;
```
- **适用场景**：文学杂谈、长篇散文、日常随笔。
- **视觉感受**：具有纸质书刊出版物的呼吸感与沉静感。

#### 方案 C：中性工整风（优先思源黑体）
```css
--font-sans-neutral: system-ui, -apple-system, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
```
- **适用场景**：跨多操作系统的一致排版。

---

### 10.3 如果我想使用“自选字体”该怎么做？

中文字体库通常包含 6,000 至 20,000+ 个汉字，文件体积极大（通常单个 `.ttf` 或 `.otf` 达到 10MB ~ 30MB）。如果在博客中直接全量引入，会导致首屏加载变慢数秒甚至几十秒。

如果你想使用自选字体，推荐按以下三条路线实施：

#### 策略 1：仅自选中英文字体中的“英文字体”（极力推荐，性价比最高）
因为英文字体文件通常只有几十 KB（20KB ~ 50KB），引入完全没有性能负担。你可以将英文和数字换成你喜欢的现代字体（例如 **Inter**, **Geist**, **JetBrains Mono** 或 **Fira Code**），而中文依然使用系统自带的苹方 / 微软雅黑：
```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&display=swap');

:root {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

#### 策略 2：通过 Google Fonts 引入支持动态分片（Unicode Range）的中文字体
Google Fonts 针对部分开源中文字体（如 **Noto Sans SC 思源黑体**、**Noto Serif SC 思源宋体**、**Ma Shan Zheng 马善政楷书**）做了智能分包（根据页面实际出现的字符动态下载对应的 30KB 小切片包）：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&display=swap" rel="stylesheet">
```
然后在 CSS 中声明：
```css
:root {
  font-family: 'Noto Serif SC', -apple-system, "PingFang SC", "Microsoft YaHei", serif;
}
```

#### 策略 3：自托管开源轻量中文字体（如：霞鹜文楷 Lite）
如果非常喜欢某种特殊中文风格（如手写楷体风格的「霞鹜文楷」），可以采用社区优化后的 **LXGW WenKai Screen / Lite** 的 `.woff2` 格式，放置在 `public/fonts/` 目录下并通过 `@font-face` 声明：
```css
@font-face {
  font-family: 'LXGW WenKai';
  src: url('/fonts/LXGWWenKai-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap; /* 确保字体下载完成前先使用系统字体渲染，避免白屏 */
}
```
并在 `src/styles/global.css` 中将 `font-family` 赋值给需要的容器或正文。
