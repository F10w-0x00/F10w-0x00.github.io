---
title: "本博客站的视觉和交互设计"
description: "对博客站的设计思路的记录，也是对参与博客站建设的人的致谢"
date: 2026-06-10
cover: "/images/3C00CB1E-3C8A-48A9-9FE2-BE12F01B7E87-cover.B3qC8p6g.avif"
category: "博客站"
words: 3659
---

Coding agent 虽然有很强的编码能力，但目前还是缺乏设计的品位。

这篇博文记录一下对博客站的设计思路，以免将来忘记。同时也是对参与博客站建设的人的致谢。

## 风格基调

### 首页

当我幻想要做一个博客站以后，Lia 向我提供了 Astro 教程以及几个主题模版。

这些主题模版其实都不算好看，但其中有一个相对好看的 [![](/favicons/external-links/yashjawale-github-io.png)Saral Theme](https://yashjawale.github.io/saral-theme-astro)，所以我就把它作为博客站的设计基调了。

<img alt="Saral Theme 的 demo" data-full-src="../media/Screenshot%202026-06-09%20at%2014.05.08@2x-medium.avif" decoding="async" data-caption="Saral Theme 的 demo" loading="lazy" width="656" height="576" src="/_astro/Screenshot%202026-06-09%20at%2014.05.08@2x-thumb.n6G8qpch_2a1Atg.avif" srcset="">
<img alt="我的博客站首页" data-full-src="../media/Screenshot%202026-06-09%20at%2014.06.20@2x-medium.avif" decoding="async" data-caption="我的博客站首页" loading="lazy" width="1061" height="576" src="/_astro/Screenshot%202026-06-09%20at%2014.06.20@2x-thumb.DIo6n6gp_1dAbs5.avif" srcset="">

可以明显看出，我剽窃了它的白底黑字，还有「Welcome to」和「Recent Posts」布局。不过对于它，我也有几个不满意的地方：

<ul>
<li data-comment-block-id="cb-61d5575847fb1d24">右上角有一个「关于」页的入口，但我觉得这种东西无关紧要，放在如此显眼的入口是对注意力的浪费，所以我选择了抛弃它。</li>
<li data-comment-block-id="cb-699e63e37d93f5d2">网页下方有大量的空间用来自我介绍，我还在很多个人的博客站里看过类似的设计，但我觉得这种操作把自己看得太重要了点，实际上会想进一步交流的应该只有很少的人，而且我也没太多兴趣和人一对一聊天，所以我把我的联系方式塞到了首页底下不起眼的角落里。如果遇到了问题，或有设计上的改进建议，欢迎向我反馈。</li>
</ul>

### 文档页面

我对文档页面应该叫什么有过纠结，「博文」？「文章」？「归档」？

目前决定是叫「文档」，它的范围要比「博文」和「文章」更大，不知道未来会不会再修改。

文档页面的设计参考了 [![](/favicons/external-links/www-apple-com-cn.ico)Apple 的 Newsroom 页面](https://www.apple.com.cn/newsroom/archive/)，可以看到我剽窃了它的筛选功能设计，也就是「话题」和「年份」的筛选框。至于「月份」，考虑到我的博文并不密集，所以我觉得还是不给这个筛选更好。此外，我还做了排序功能，这样的话就可以从旧的文档开始看起。

<img alt="Apple 的 Newsroom" data-full-src="../media/Screenshot%202026-06-09%20at%2014.19.30@2x-medium.avif" decoding="async" data-caption="Apple 的 Newsroom" loading="lazy" width="1044" height="576" src="/_astro/Screenshot%202026-06-09%20at%2014.19.30@2x-thumb.DkFLZDcN_2khIvz.avif" srcset="">
<img alt="我的博客站文档页" data-full-src="../media/Screenshot%202026-06-09%20at%2014.23.19@2x-medium.avif" decoding="async" data-caption="我的博客站文档页" loading="lazy" width="1124" height="576" src="/_astro/Screenshot%202026-06-09%20at%2014.23.19@2x-thumb.BerPSr9p_132Bwq.avif" srcset="">

在文档的筛选和排序区域，我增加了两个小小的动画。

在思考给排序的动画时，我的脑子里闪过一个灵光，所以现在放在按照时间排序按钮附近的，是一个等边三角形。等边三角形可以实现一个奇妙的设计——点击按钮后，只需要旋转 60 度，就等效于旋转 180 度（上下翻转）。我不知道世界上有没有其他的人进行了和我一样的设计，我做它主要是觉得很好玩。我并不明确地知道按照时间排序时应该使用什么朝向的箭头， 所以我选择了保留模糊性。

筛选处还有一个箭头动画，这是 Lia 的主意。点击筛选框以后，箭头会有平滑的过渡动画，就像是鸟在飞一样。

### 颜色

我的网站的色彩设计是对苹果性冷淡风格和莫兰迪色的糅合。

苹果给我提供了黑白灰上的审美愉悦感，它足够中性，不会出错。所以在不需要彩色的场合，我会使用黑白灰。

在需要色彩的场合，我让 coding agent 使用莫兰迪色作为配色方案。我是此前从 Lia 那里知道这个名词的，它是一种低饱和度的配色方案，让我觉得满意，不喧宾夺主，有一种淡淡的高级感。

在使用彩色时，我对不同的色彩有专门的使用规定，我希望用颜色来表达固定的语义。例如，蓝色在我的博客里永远表示前往博客站内部的链接，所以首页的 hover 效果、博文顶部的分类、博文里所有的内部链接、博文里小标题的 hover 效果……全部是蓝色。

对于前往站外的链接，我则统一采取棕色的颜色。这其实不太符合超链接的蓝色传统，不过能让用户更清楚链接的结果，所以我就这么做了。由于棕色违反了超链接的蓝色传统，所以它的下划线需要保留下来，否则用户会困惑。

除了链接，还有一些别的颜色使用规则：<code>内联代码块</code> 和代码块都是绿色（绿色带有一点对终端的想象）；引用块都是紫色（没特别的原因，硬要说的话，紫色有一点异质感）……

## 博文页面

### 保持专注

在电脑上阅读文字时，往往屏幕的左右两侧是空出来的——如果文字部分的宽度很大，那么人在换行的时候就容易前往错误的行，所以需要减少文章的宽度。

这时候就有很多「擅长」利用空间的人，把网页空出来的左右两边塞上各种各样的东西。在阅读一些网站的文章时，我时常被这样的设计者折磨，他们难道一点都感受不到专注的快乐吗？

所以我对博文的期待是左右两边不要有任何东西，空着就好。我希望用户在打开博文页面的时候，就像是打开了 Safari 的阅读模式，干净、专注。

像维基百科这样的网站把外观设置放在了侧边，需要我手动点击才能离去，让我觉得非常麻烦。类似地，很多用国产手机系统的人总是喜欢说手机上的广告「可以关」，这种说辞让我觉得无语，就算可以关，大部分人也是不会想去研究怎么关的。所以我对自己的博文页面的要求是，就算不进行任何探索，就已经是干净的最佳状态。

### 图片堆叠

目前，当我在博文里插入多张图片时，它们会堆叠在一起。点击翻页按钮时，它们会有炫酷的翻页动画，我花了一些时间来把动画调好。在 Safari 上，出现了一些特别的错误动画，需要付出额外的时间修复。这次构建博客的过程让我感觉到了 Safari 的不便——更容易出现奇怪的错误，也更难以被调试。

点击图片后，会进入放大版的图片堆叠，在图片放大的动画里，网站使用原有的模糊图片先糊弄。等完全进入放大状态以后，图片加载为最大尺寸为 3000px 的图片。通过设计两种图片尺寸的方式，我节省了网站的流量，并提高了加载速度。

关于图片的展示，有的博客采取了放在正文侧边的形式，这样的空间利用不错。我不能说我的设计是更好的，不过为了追求对称美，目前就是这种占掉一大行的设计了。

### 注意事项

我的博文都是 Markdown 格式，网页是从 Markdown 原文按照规则自动转化而来的。一开始，我没有做注意事项的语法支持，原因在于这并不是 Markdown 标准语法。

但后面还是决定做，有了注意事项以后，我就可以把一些对上文的补充内容以注意事项的形式书写，当我对博文更新以后，也可以用注意事项在博文的最开始说明更新了什么。

<blockquote class="callout callout-note">

附言

此前，Lia 就提议过注意事项的格式支持，但被我往后排了。现在觉得 Lia 当前的提议是正确的。

</blockquote>

### 外链的自动 favicon 显示

Favicon 是 favorites icon 的缩写，也就是出现在浏览器标签栏和收藏栏的网站图标。

[![](/favicons/external-links/ggame-gledos-science.png)Lia 的网站](https://ggame.gledos.science/mkdocs/%E5%A4%96%E9%83%A8%E9%93%BE%E6%8E%A5%E7%AC%A6%E5%8F%B7.html)<span class="link-boundary-space external-link-trailing-space" aria-hidden="true"></span>里带有对外链 favicon 的部分显示，我觉得精致，所以就剽窃了这一设计。

不过我采用的是自动抓取 favicon 的形式，这样一来就不需要人工介入了。从我的审美来说，现在的外链 favicon 看上去很精致。

缺点在于，由于 favicon 是自动抓取的，所以 favicon 的质量参差不齐，不同网站对 favicon 的设计质量与风格不同。例如 GitHub 的 favicon 在深色模式下很糟，但我不打算为 GitHub 擦屁股，所以保留了它的这一难读性。

<img alt="深色下的 GitHub favicon" data-full-src="../media/Screenshot%202026-06-10%20at%2015.51.30@2x%201-medium.avif" decoding="async" data-caption="深色下的 GitHub favicon" loading="lazy" width="1536" height="469" src="/_astro/Screenshot%202026-06-10%20at%2015.51.30@2x-thumb.CqyJwicQ_Z1yeVgW.avif" srcset="">
<img alt="浅色下的 GitHub favicon" data-full-src="../media/Screenshot%202026-06-10%20at%2015.52.12@2x-medium.avif" decoding="async" data-caption="浅色下的 GitHub favicon" loading="lazy" width="1536" height="467" src="/_astro/Screenshot%202026-06-10%20at%2015.52.12@2x-thumb.BF-3qpID_O7PMC.avif" srcset="">

还有一些人认为，favicon 让博文在阅读的过程里存在干扰。也许的确如此。

### 同页面的跳转

[<span class="same-page-anchor-indicator is-up" aria-hidden="true"><svg class="same-page-anchor-icon" viewBox="0 0 260 260" focusable="false" aria-hidden="true"><g transform="translate(130 130) scale(1 -1) translate(-130 -130)"><g transform="translate(130 130) scale(1.23) translate(-130 -130) rotate(-90 130 130) translate(0 29)"><path class="same-page-anchor-turn-arrow" d="M132.6 31.2 C135.9 31.2 138.6 33.9 138.6 37.2 L138.6 66.8 C181.0 67.0 207.7 94.8 213.6 151.2 C214.4 158.7 204.5 162.2 200.2 156.0 C184.6 133.3 166.4 125.3 138.6 125.2 L138.6 153.8 C138.6 159.2 132.3 162.1 128.1 158.5 L62.9 103.0 C59.0 99.7 59.0 93.7 62.9 90.4 L128.5 32.8 C129.6 31.8 131.1 31.2 132.6 31.2 Z"></path></g></g></svg></span>上面](#19aed4)<span class="link-boundary-space same-page-anchor-trailing-space" aria-hidden="true"></span>提到，我对网页有统一的对蓝色样式的语义，所以博文内的「跳转到当前博文某处」和「跳转到另外的博文」的链接是蓝色的。

为了增加语义上的区分，我为「在当前博文内跳转」的超链接的前方增加了从右出发的朝上或者朝下的箭头，这样一来，就可以知道这个链接将会带用户去哪里了，增加了用户点击链接时的心理安全感。

feixqe 觉得需要给页面内增加一个返回按钮，我向 ta 告知，其实可以点浏览器的返回键，这样就会返回原位了。

如果增加按钮，会破坏页面的简洁；如果不增加按钮，会有人蒙在鼓里。这是一个需要权衡的点。出于设计的宽容原则，为了让想不到返回键的人也能舒适使用我的博客站，我还是增加了一个不显眼的锚点返回按钮，它会在点击相同博文跳转的链接后出现在顶栏的右侧，并在目标内容离开屏幕后自动消失。

目前，我还没有想好怎么处理「跳转到另外的博文」的链接的设计。所以这类链接目前没有特殊外观。

### 表格

| 标题 | 正文 |
| :--- | :--- |
| 设计难点1 | 表格的设计要比想象中的复杂，需要知道表格文本的语义，才能排好版。也就是说，重要的内容，要比次要的内容有更多的空间冗余。靠代码无法实现这种排版智能，原因在于无法知道表格里不同内容的重要性。 |
| 设计难点2 | 还有一个问题是换行的策略，如果采用自动换行的方式，那么当换行过于频繁时，就会变成难以阅读的情况。不同的屏幕尺寸也会让合理的换行策略变得复杂。 |
| 当前设计 | 目前，我使用了一种简单的表格排版策略——设置列的最小宽度以避免过度换行。同时，由于一般来说表格的左列更重要，那么这种最小宽度会带来左列的冗余，起到强调左列的作用。目前的策略还有明显缺点，我可能在后续进一步调整。 |

### 折叠的引用块和代码块

我为代码块和引用块设计了专门的样式。当代码块或引用块里包含较多内容时，会被自动折叠。可以通过点击按钮或者渐隐状态的文字来展开。

下面是博客站折叠代码块的实现核心样式规则，当代码超出 10 行时自动触发折叠并生成语言徽标与展开按钮：

```css
.code-block
  position
  margin
}
.code-block[data-code-language]::before
  position
  top
  left
  content
  border-radius
  background
  color
  transform
}
.collapsible-block.is-collapsed .collapsible-block-content
  max-height
}
```

群友 cheems 提醒我部分折叠块的样式怪异，触发了折叠样式，但是点击展开以后只展开一点，导致了体验的糟糕。

这时，我才意识到「触发折叠的高度阈值」和「折叠后的高度」应该是两个不同的数值，通过让「折叠后的高度」低于「触发折叠的高度阈值」，就可以避免 cheems 遇到的那种刚好触发了折叠的糟糕情况。

## 其他

### 打开链接的方式

之前被 Lia 教导过，如果站内链接一般是同标签页，如果站外链接一般是新标签页。海外网站往往遵守这个原则，而国内网站未必遵守这个原则，总是开启新的标签页。

我的博客站也是按照 Lia 提及的设计理念做的，只有站外链接会以新标签页的形式打开。

不过我不确信这样的设计是更好，手动选择从新标签页打开以后，新标签页是以后台的形式打开，还需要我进行一次标签页的切换。（Lia 教我的小妙招：通过按住 <code>command-shift</code> 或 <code>control-shift</code>，可以在以新标签页打开的同时将新标签页前台显示）

并且，尽管对于熟悉电脑的人来说，在按住 <code>command</code> 或 <code>control</code> 的同时来打开新标签页是常识。但对于电脑小白来说，他们未必知道这个常识，所以需要对他们宽容。

另外，其实我自己觉得像哔哩哔哩这样的网站在点击视频后直接打开新标签页挺方便，我不介意开一堆标签页，这在我看来是方便的好事。

由于我还没有想明白这个问题，所以暂且按照海外的常规方式来处理。
