# 博客 Markdown & LaTeX 写作速查手册

> 将本文件或任意 PDF / ZIP / EPUB 放进当前文章目录的 `./assets/`，在 Markdown 中单行独立引用即可自动生成极简下载卡片。

## 1. 最简文章头（Frontmatter）

```yaml
---
title: "文章标题"
description: "可选摘要"
date: 2026-11-24
category: "学习"
cover: ./assets/cover.png
# draft: true
---
```

## 2. 图片与附件

```markdown
![图片说明](./assets/diagram.png "居中灰色图注文字")
[下载指南.pdf](./assets/guide.pdf)
```

## 3. 五种 Callout 提示框

```markdown
> [!NOTE] 说明
> [!TIP] 技巧
> [!IMPORTANT] 重要
> [!WARNING] 警告
> [!CAUTION] 危险
> [!NOTE CALLOUT-ICON-ONLY]
```

## 4. LaTeX 数学公式

- 行内公式：`$E = mc^2$`
- 块级公式：

```latex
$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$
```
