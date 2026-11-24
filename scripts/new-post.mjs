#!/usr/bin/env node
// scripts/new-post.mjs
// 一键创建「一文一盒」文章目录：posts/YYYY-MM-DD-<slug>/index.md + assets/
// 用法:
//   pnpm new my-first-post
//   pnpm new "如何搭建个人知识库" --slug personal-kb --category 学习

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function getLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toSafeSlug(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const input = positional.join(' ').trim();

if (!input && !flags.slug && !flags.title) {
  console.log(`用法:
  pnpm new <slug-or-title> [--title "文章标题"] [--slug url-slug] [--category 分类] [--book | --paper] [--draft]

示例:
  pnpm new my-note --title "我的第一篇笔记" --category 学习
  pnpm new ddia-notes --book --title "精读 DDIA" --category 学习
  pnpm new attention-paper --paper --title "精读 Attention Is All You Need" --category 学习
`);
  process.exit(1);
}

const dateStr = typeof flags.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(flags.date) ? flags.date : getLocalDateString();
const title = typeof flags.title === 'string' ? flags.title : input || flags.slug;
const rawSlug = typeof flags.slug === 'string' ? flags.slug : input || title;
const safeSlug = toSafeSlug(rawSlug);

if (!safeSlug) {
  console.error('错误: 无法生成有效的文章目录名，请通过 --slug 指定英文短名。');
  process.exit(1);
}

const dirName = /^\d{4}-\d{2}-\d{2}-/.test(safeSlug) ? safeSlug : `${dateStr}-${safeSlug}`;
const category = typeof flags.category === 'string' ? flags.category : '日常';
const isDraft = Boolean(flags.draft);
const shelfType = flags.paper ? 'paper' : flags.book ? 'book' : null;

const postsDir = path.resolve(process.cwd(), 'posts');
const postDir = path.join(postsDir, dirName);
const assetsDir = path.join(postDir, 'assets');
const indexMdPath = path.join(postDir, 'index.md');

if (fs.existsSync(postDir)) {
  console.error(`错误: 文章目录已存在: posts/${dirName}/`);
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });

const escapedTitle = String(title).replace(/"/g, '\\"');
const shelfLines = shelfType
  ? [
      `tags: ["${shelfType}"]`,
      'shelf:',
      `  type: ${shelfType}`,
      `  group: "${shelfType === 'paper' ? 'Papers' : 'Books'}"`,
      `  title: "${escapedTitle}"`,
      '  author: ""',
      `  # pages: ${shelfType === 'paper' ? '15' : '400'}`,
      `  # cover: ./assets/${shelfType === 'paper' ? 'paper-page1.png' : 'shelf-cover.jpg'}`,
    ]
  : ['# tags: ["book"]  # 加上 book / paper 标签即可自动上架首页 F10w\'s Shelf'];

const frontmatter = [
  '---',
  `title: "${escapedTitle}"`,
  'description: ""',
  `date: ${dateStr}`,
  `category: "${category}"`,
  ...shelfLines,
  '# cover: ./assets/cover.png',
  isDraft ? 'draft: true' : '# draft: true',
  '---',
  '',
  '## 开篇',
  '',
  '在这里开始写作。',
  '',
].join('\n');

fs.writeFileSync(indexMdPath, frontmatter, 'utf8');

console.log(`已创建文章盒子:
  正文: posts/${dirName}/index.md
  资源: posts/${dirName}/assets/
  预览链接: /blog/${dirName}/

写作提示:
  插入图片: ![说明](./assets/pic.png "可选图注")
  插入附件: [资料.pdf](./assets/guide.pdf)
`);
