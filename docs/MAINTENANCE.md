# 日常维护手册 (Maintenance Manual)

## 1. 新建博文规范

在 `src/content/blog/` 下创建新的 `.md` 或 `.mdx` 文件，文件名采用日期+英文slug格式，例如：
`src/content/blog/2026-10-25-my-new-post.md`

### 1.1 Frontmatter 必填规范
```yaml
---
title: "博文完整大标题"
description: "用于 SEO 与元数据展示的摘要概述"
pubDate: 2026-10-25
category: "博客站"   # 所属分类 (如: 博客站, 思考, 旅行, 未分类)
cover: "/images/covers/cover-2026-10-25.avif" # 可选封面横幅图
wordCount: 1250      # 字数统计
---
```

---

## 2. 特殊排版语法支持

### 2.1 站外链接书写规范
正文中所有指向外部域名的链接会自动解析域名并渲染 Favicon 图标与棕色字体：
```markdown
[外部参考站点](https://example.com)
```

### 2.2 注意事项 (Admonition) 语法
```markdown
> [!NOTE]
> 这是一个补充注意事项说明。

> [!TIP]
> 这是一个技巧提示说明。
```

### 2.3 图片堆叠 (Image Stack)
连续放置的多张图片在编译阶段会自动封装进堆叠容器中：
```markdown
![图片1](/images/p1.webp)
![图片2](/images/p2.webp)
```

---

## 3. 本地预览与生产构建

```bash
# 进入 Nix 开发环境并安装依赖
nix-shell -p nodejs pnpm --run "pnpm install"

# 启动本地开发热重载服务 (默认端口 4321)
nix-shell -p nodejs pnpm --run "pnpm dev"

# 执行生产静态编译
nix-shell -p nodejs pnpm --run "pnpm build"

# 本地预览编译后的静态产物
nix-shell -p nodejs pnpm --run "pnpm preview"
```
