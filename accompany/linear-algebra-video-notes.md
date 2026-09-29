---
layout: accompany
title: 3Blue1Brown 线性代数视频随堂笔记
permalink: /accompany/linear-algebra-video-notes/
math: true
---

这是随堂伴随笔记，本篇在博客文章列表（/blog/）中不可见，仅作为主文章的辅助侧栏对照展开。

### 1. 核心直觉：矩阵即变换

矩阵并不是数字的枯燥矩形方阵，而是空间的一种**线性变换**（Linear Transformation）：

- 保持网格线平行且等距分布。
- 原点保持固定不动。

如果基向量 $\hat{i}$ 落在 $(a, c)$，基向量 $\hat{j}$ 落在 $(b, d)$，那么整个空间的任意向量变换后就是：

$$\begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} = x \begin{bmatrix} a \\ c \end{bmatrix} + y \begin{bmatrix} b \\ d \end{bmatrix}$$

### 2. 行列式的几何意义

行列式 $\det(A)$ 代表变换后**面积（2D）或体积（3D）的缩放比例**：

- 若 $\det(A) = 0$，说明空间被压缩至更低维度（降维），方程组存在不可逆性。
- 若 $\det(A) < 0$，说明空间的朝向发生了翻转。

> 💡 **对照速查**：左侧为主笔记理论证明，右侧为直觉几何解读，两边相互印证。
