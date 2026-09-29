---
layout: post
title: "Developer Core Cheatsheet: Git & Shell Patterns"
date: 2026-09-20
tags: [CheatSheet]
excerpt: "A high-frequency cheatsheet covering essential Git operations, branch maintenance, and useful shell one-liners with fast clipboard copying."
---

这是一份高频核心命令与配置速查清单。所有代码块右上角均支持**一键复制**。

## 1. Git 分支与历史高效维护

### 优雅重置与变基

```bash
# 暂存当前未提交的修改并清理工作区
git stash push -m "wip-feature"

# 拉取远端最新分支并执行变基（保持整洁单线历史）
git pull --rebase origin main

# 弹出暂存代码
git stash pop
```

### 撤销最近一次 Commit 但保留工作区修改

```bash
git reset --soft HEAD~1
```

## 2. Shell 常用诊断命令

```bash
# 快速排查占用指定端口的进程 (Windows PowerShell)
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess

# 查看目录文件大小排行
du -sh * | sort -hr | head -n 10
```

> **速查建议**：善用标签过滤随时在 Blog 列表筛选所有带 `CheatSheet` 标记的笔记。
