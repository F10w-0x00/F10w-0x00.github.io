---
layout: post
title: "线性代数核心笔记：特征值分解与几何投影"
date: 2026-09-24
tags: [Note]
math: true
excerpt: "系统梳理特征值分解（Eigendecomposition）与投影矩阵，内附伴随视频笔记，点击即可在右侧 6:4 分屏即时对照阅读。"
---

线性代数是机器学习、图形学与现代算法的基石。在推导特征值方程时，结合直观几何图景往往能事半功倍。

> 📌 **伴随笔记体验**：  
> 点击查看右侧分栏伴随材料 👉 [视频笔记.md](/accompany/linear-algebra-video-notes/) （页面不刷新，直接在右侧分屏展开）。

## 1. 特征向量与特征值的代数定义

设 $A \in \mathbb{R}^{n \times n}$，若存在非零向量 $v \in \mathbb{R}^n$ 及标量 $\lambda \in \mathbb{R}$，满足：

$$A v = \lambda v$$

则称 $\lambda$ 为矩阵 $A$ 的特征值，$v$ 为对应的特征向量。

求解特征方程即求行列式等于零：

$$\det(A - \lambda I) = 0$$

## 2. 谱定理与正交对角化

若矩阵 $A$ 为实对称矩阵（$A = A^T$），则 $A$ 拥有 $n$ 个相互正交的特征向量，且所有特征值均为实数。因此 $A$ 可以被正交对角化：

$$A = Q \Lambda Q^T = \sum_{i=1}^n \lambda_i q_i q_i^T$$

其中 $Q$ 为正交矩阵（$Q^T Q = I$），$\Lambda = \text{diag}(\lambda_1, \dots, \lambda_n)$ 为对角矩阵。

## 3. 伴随参考与几何直觉

如果你想快速回看三维或二维空间的缩放与投影几何变换，随时点击顶部的 [视频笔记.md](/accompany/linear-algebra-video-notes/)。右侧分栏与左侧正文独立滚动，支持对照速查。
