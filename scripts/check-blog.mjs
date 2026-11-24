#!/usr/bin/env node
// scripts/check-blog.mjs
// 长期防劣化内容体检脚本：检查 Frontmatter、断链、孤儿图片/附件、超大文件与工具函数自检

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeShelfDimensions,
  countWords,
  extractMarkdownHeadings,
  formatChineseDate,
  normalizePostId,
  parseDate,
  resolveShelfMeta,
} from '../src/utils/post-helpers.mjs';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15 MB
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.bmp']);
const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', '.gitkeep']);

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseSimpleFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { data: null, body: raw };
  const fmText = match[1];
  const body = raw.slice(match[0].length);
  const data = {};
  let currentBlock = null;
  for (const line of fmText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const isIndented = /^[ \t]+/.test(line);
    const kv = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    // 去掉行尾注释（非引号内）
    if (!val.startsWith('"') && !val.startsWith("'")) {
      val = val.replace(/\s+#.*$/, '').trim();
    }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!isIndented) {
      currentBlock = val === '' ? key : null;
      data[key] = val;
    } else if (currentBlock === 'shelf' && key === 'cover' && val) {
      data.shelfCover = val;
    }
  }
  return { data, body };
}

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_FILES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function extractLocalRefs(fmData, body) {
  const refs = new Set();
  const legacyRefs = new Set();

  const inspectUrl = (raw) => {
    if (!raw) return;
    let url = raw.trim().replace(/^<|>$/g, '');
    if (url.startsWith('download:')) url = url.slice('download:'.length);
    const clean = url.split('?')[0].split('#')[0].trim();
    if (!clean) return;
    if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(clean)) return;
    if (clean.startsWith('/images/') || clean.startsWith('/files/')) {
      legacyRefs.add(clean);
      return;
    }
    if (clean.startsWith('/')) return; // 站内路由或 public 公共路径
    refs.add(clean);
  };

  if (fmData?.cover) inspectUrl(fmData.cover);
  if (fmData?.shelfCover) inspectUrl(fmData.shelfCover);

  // 先剥离 HTML 注释、围栏代码块与行内代码，避免示例代码或注释误报断链
  const activeBody = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');

  // Markdown 图片与链接: ![alt](url "title") / [text](url "title")
  for (const m of activeBody.matchAll(/!?\[[^\]]*\]\(\s*([^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g)) {
    inspectUrl(m[1]);
  }
  // HTML src="..." / href="..."
  for (const m of activeBody.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    inspectUrl(m[1]);
  }

  return { refs: [...refs], legacyRefs: [...legacyRefs] };
}

function runHelperSelfTests() {
  assert.equal(normalizePostId('2026-10-01-demo/index.md'), '2026-10-01-demo');
  assert.equal(normalizePostId('2026-11-24-note.md'), '2026-11-24-note');
  assert.equal(parseDate('invalid').toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(formatChineseDate('2026-10-01', 2026), '10月1日');
  assert.equal(formatChineseDate('2025-10-01', 2026), '2025年10月1日');
  assert.equal(countWords('你好世界 hello world'), 6);
  assert.deepEqual(
    extractMarkdownHeadings('## 第一节 `code`\n```md\n## 忽略\n```\n## 第二节 [链接](https://a.com)\n## 第三节'),
    ['第一节 code', '第二节 链接', '第三节']
  );
  assert.equal(resolveShelfMeta({ tags: ['日常'], title: '随笔', date: '2026-11-24' }), null);
  assert.equal(resolveShelfMeta({ tags: ['paper'], title: 'Transformer', date: '2026-11-24' })?.type, 'paper');
  assert.equal(resolveShelfMeta({ tags: ['book'], shelf: false, title: 'Ignored', date: '2026-11-24' }), null);
  assert.ok(computeShelfDimensions({ type: 'paper', pages: 15 }).spineWidth <= 16);
  assert.ok(
    computeShelfDimensions({ type: 'book', pages: 1120 }).spineWidth >
      computeShelfDimensions({ type: 'book', pages: 250 }).spineWidth
  );
  assert.equal(computeShelfDimensions({ type: 'book', thickness: 76 }).spineWidth, 76);
}

runHelperSelfTests();

const errors = [];
const warnings = [];
let postCount = 0;
let draftCount = 0;

if (!fs.existsSync(POSTS_DIR)) {
  console.error('错误: 未找到 posts/ 目录');
  process.exit(1);
}

const allFilesInPosts = walkFiles(POSTS_DIR);
const mdFiles = allFilesInPosts.filter((f) => {
  if (!f.endsWith('.md')) return false;
  const relParts = path.relative(POSTS_DIR, f).split(path.sep);
  return !relParts.includes('assets');
});

for (const mdPath of mdFiles) {
  postCount++;
  const relMd = path.relative(ROOT, mdPath).replace(/\\/g, '/');
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { data, body } = parseSimpleFrontmatter(raw);

  if (!data) {
    errors.push(`[${relMd}] 缺少 YAML Frontmatter`);
    continue;
  }
  if (!data.title) {
    errors.push(`[${relMd}] 缺少必填字段 title`);
  }
  if (!data.date || Number.isNaN(new Date(data.date).getTime())) {
    errors.push(`[${relMd}] 日期字段 date 缺失或格式非法: "${data.date || ''}"`);
  }
  if (data.draft === 'true') {
    draftCount++;
  }

  const postDir = path.dirname(mdPath);
  const { refs, legacyRefs } = extractLocalRefs(data, body);
  const resolvedReferenced = new Set();

  for (const legacy of legacyRefs) {
    warnings.push(`[${relMd}] 仍使用了旧版全局路径 "${legacy}"，建议移入本文 ./assets/ 目录`);
  }

  for (const ref of refs) {
    let decoded = ref;
    try {
      decoded = decodeURIComponent(ref);
    } catch {}
    const absTarget = path.resolve(postDir, decoded);
    if (!absTarget.startsWith(POSTS_DIR + path.sep)) {
      errors.push(`[${relMd}] 资源路径越界 posts/ 目录: "${ref}"`);
      continue;
    }
    if (!fs.existsSync(absTarget) || !fs.statSync(absTarget).isFile()) {
      errors.push(`[${relMd}] 引用的本地资源不存在: "${ref}"`);
      continue;
    }
    resolvedReferenced.add(path.normalize(absTarget));

    const stat = fs.statSync(absTarget);
    const ext = path.extname(absTarget).toLowerCase();
    if (IMAGE_EXTS.has(ext) && stat.size > MAX_IMAGE_BYTES) {
      warnings.push(`[${relMd}] 图片体积偏大 (${formatMB(stat.size)} > 3 MB): ${ref}`);
    } else if (!IMAGE_EXTS.has(ext) && stat.size > MAX_ATTACHMENT_BYTES) {
      warnings.push(`[${relMd}] 附件体积偏大 (${formatMB(stat.size)} > 15 MB)，建议改用 GitHub Releases: ${ref}`);
    }
  }

  // 若该文章位于独立子目录盒子（该目录仅含这 1 篇 .md，无论是否叫 index.md），检查盒内孤儿文件
  if (postDir !== POSTS_DIR) {
    const siblingMds = fs.readdirSync(postDir).filter((f) => f.endsWith('.md'));
    if (siblingMds.length === 1) {
      const bundleFiles = walkFiles(postDir).filter((f) => path.normalize(f) !== path.normalize(mdPath));
      for (const bf of bundleFiles) {
        if (!resolvedReferenced.has(path.normalize(bf))) {
          const relOrphan = path.relative(ROOT, bf).replace(/\\/g, '/');
          warnings.push(`[${relMd}] 发现未被引用的孤儿资源: ${relOrphan}`);
        }
      }
    }
  }
}

console.log(`博客内容体检完成：共扫描 ${postCount} 篇文章（其中草稿 ${draftCount} 篇）`);

if (warnings.length > 0) {
  console.log(`\n警告 (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}

if (errors.length > 0) {
  console.error(`\n错误 (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('状态: PASS（0 断链，0 异常 Frontmatter，核心辅助函数自检通过）');
