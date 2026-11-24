---
title: "精读 DDIA：数据密集型应用系统设计"
description: "从单机存储引擎到分布式复制、分区与共识算法，系统梳理现代数据系统的底层权衡与设计哲学。"
date: 2026-11-25
category: "学习"
tags: ["book", "systems"]
shelf:
  type: book
  group: "Books"
  title: "Designing Data-Intensive Applications"
  author: "Martin Kleppmann"
  year: 2017
  pages: 611
  color: "#ce263c"
  cover: ./assets/shelf-cover.jpg
  order: 1
---

> [!NOTE] 书架示范说明
> 这是一篇示范读书笔记：只要在文章顶部写上 `tags: ["book"]`（或配置 `shelf` 字段），文章就会自动汇集到首页的 **F10w's Shelf** 3D 书架，并自动提取正文的 `##` 标题作为预览弹窗目录。你可以随时替换正文或放入 `./assets/cover.jpg` 自定义书封。

## 可靠性、可扩展性与可维护性

DDIA 开篇用三个核心维度框定了数据系统的工程目标：

- **可靠性（Reliability）**：即使出现硬件故障、软件缺陷或人为失误，系统仍能维持正确行为；
- **可扩展性（Scalability）**：用具体负载指标（QPS、读写比、扇出系数）与尾延迟（P95 / P99）度量性能退化；
- **可维护性（Maintainability）**：通过清晰抽象与可观测性降低长期演进的认知负担。

## 存储引擎：LSM-Tree 与 B-Tree

绝大多数持久化数据库底层都可以归结为两类索引结构：

- **LSM-Tree + SSTable**：写入顺序追加到 WAL 与 MemTable，后台异步归并压缩，适合高写入吞吐场景，但读路径可能涉及多层查找与布隆过滤器优化；
- **B-Tree**：以固定大小页（通常 4 KB–16 KB）原地更新，读延迟极其稳定，借助 WAL 保证崩溃恢复。

## 数据编码与跨版本演进

在滚动升级与多服务协作下，数据格式必须同时兼顾**向前兼容**与**向后兼容**。Protobuf、Thrift 与 Avro 通过字段编号或 Schema 注册中心替代冗余字段名，在压缩体积与演进安全性之间取得了很好的平衡。

## 分布式复制与一致性模型

复制不仅为了容灾与就近读取，更直接决定了系统的读写语义：

- **读己之写（Read-your-writes）**、**单调读（Monotonic reads）** 与 **一致前缀读** 是工程里最常被忽略的客户端体验问题；
- **主从、多主与无主（Quorum $w + r > n$）** 分别对应不同的写冲突处理复杂度。

## 事务隔离与分布式共识

弱隔离级别（Read Committed、Snapshot Isolation）容易掩盖**写偏斜（Write Skew）**与幻读。真正要让分布式节点对“唯一主节点”或“原子提交”达成一致，归根结底都会归约到 **线性一致性** 与 **全序广播（Raft / Paxos）**。

## 批处理、流处理与派生数据

全书后半段最有启发性的一点是把应用架构重新理解为**「记录系统（System of Record）+ 派生数据（Derived Data）」**：通过不可变事件日志把缓存、搜索索引与物化视图统一起来，让系统既容易重放纠错，又具备清晰的演进边界。
