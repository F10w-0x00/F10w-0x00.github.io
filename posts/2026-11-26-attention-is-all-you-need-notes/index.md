---
title: "精读 Attention Is All You Need"
description: "彻底抛弃循环与卷积结构，仅凭自注意力机制重塑序列建模与现代大语言模型底座的里程碑论文。"
date: 2026-11-26
category: "学习"
tags: ["paper", "ai"]
shelf:
  type: paper
  group: "Papers"
  title: "Attention Is All You Need"
  author: "Vaswani et al. · NeurIPS 2017"
  year: 2017
  pages: 15
  cover: ./assets/paper-page1.png
  order: 2
---

> [!TIP] 论文书架示范说明
> 这是一篇示范论文精读笔记：在 Frontmatter 标记 `tags: ["paper"]` 或 `shelf: { type: paper }` 后，首页 3D 书架会自动以**学术抽印本（Offprint）**样式为它生成实体封面与编号书脊，并将正文 `##` 小节提取至预览弹窗。

## 研究动机：摆脱顺序依赖

在 Transformer 之前，RNN / LSTM 虽擅长建模序列，但隐状态 $h_t$ 严格依赖 $h_{t-1}$，导致长序列难以跨时间步并行训练，且远距离信息传递路径长度为 $O(n)$。Transformer 的核心突破是用全局自注意力把任意两个位置之间的信号路径缩短到 $O(1)$。

## Scaled Dot-Product Attention

论文将注意力形式化为查询（$Q$）、键（$K$）与值（$V$）之间的加权聚合，并引入缩放因子 $\frac{1}{\sqrt{d_k}}$ 防止高维点积落入 Softmax 梯度饱和区：

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

## Multi-Head Attention

与其在 $d_{\text{model}}$ 维空间做单次注意力，不如将其线性投影到 $h$ 个低维子空间并行计算，再拼接映射回原维度：

$$
\mathrm{MultiHead}(Q, K, V) = \mathrm{Concat}(\mathrm{head}_1, \dots, \mathrm{head}_h)W^O
$$

不同注意力头由此可以同时关注局部句法依赖、长程指代消解与语义对齐。

## 位置编码（Positional Encoding）

由于纯自注意力对词序置换不敏感，论文采用不同频率的正余弦函数注入位置信息：

$$
PE_{(pos,\,2i)} = \sin\!\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right), \qquad
PE_{(pos,\,2i+1)} = \cos\!\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)
$$

这种构造的一个优雅性质是 $PE_{pos+k}$ 可以表示为 $PE_{pos}$ 的线性变换，方便模型学习相对位置关系（后来也启发了 RoPE 等旋转位置编码）。

## 复杂度与并行性权衡

当序列长度 $n$ 小于表示维度 $d$ 时，自注意力的每层复杂度 $O(n^2 \cdot d)$ 与全并行特性远胜循环网络；而当上下文扩展至超长序列时，$O(n^2)$ 成为主要瓶颈，直接催生了 FlashAttention、KV-Cache 与线性注意力等一系列后续研究。

## 读后思考与延伸阅读

回头看 2017 年这篇论文，真正决定其历史地位的不只是单点 BLEU 指标提升，而是**高度规整的矩阵乘法结构极度契合现代 GPU 算力缩放规律（Scaling Laws）**——工程简洁性最终解锁了通往大语言模型的道路。
