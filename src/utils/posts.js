// src/utils/posts.js
// 统一文章加载、元数据解析、日期兜底与自动字数统计

const FALLBACK_DATE_ISO = '2026-01-01T00:00:00.000Z';

export function parseDate(dateInput) {
  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    return dateInput;
  }
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    const parsed = new Date(dateInput);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date(FALLBACK_DATE_ISO);
}

export function formatChineseDate(dateInput) {
  if (!dateInput) return '';
  const d = parseDate(dateInput);
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${m}月${day}日`;
}

export function formatISODate(dateInput) {
  if (!dateInput) return '';
  return parseDate(dateInput).toISOString();
}

export function getSlugFromPath(filePath) {
  return String(filePath).split('/').pop().replace(/\.md$/i, '');
}

export function countWords(rawMarkdown) {
  if (typeof rawMarkdown !== 'string' || !rawMarkdown.trim()) return 0;

  const cleaned = rawMarkdown
    // 移除 HTML 注释
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // 移除图片语法 ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // 链接仅保留可见文案 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // 移除围栏代码标记行本身，保留代码内有意义的词元
    .replace(/^```[^\n]*$/gm, ' ')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, ' ')
    // 移除常见 Markdown 语法符号
    .replace(/[`*_~>#|]/g, ' ');

  const cjkMatches = cleaned.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || [];
  const withoutCjk = cleaned.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
  const latinMatches = withoutCjk.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];

  return cjkMatches.length + latinMatches.length;
}

export function processPosts(postModules) {
  const posts = Object.entries(postModules).map(([filePath, mod]) => {
    const slug = getSlugFromPath(filePath);
    const fm = mod.frontmatter || {};
    const dateObj = parseDate(fm.date);

    const explicitWords = Number(fm.words);
    let rawWords;
    if (Number.isFinite(explicitWords) && explicitWords > 0) {
      rawWords = Math.round(explicitWords);
    } else {
      const rawContent = typeof mod.rawContent === 'function' ? mod.rawContent() : '';
      rawWords = countWords(rawContent);
    }

    return {
      slug,
      filePath,
      Content: mod.Content,
      title: fm.title ? String(fm.title) : slug,
      description: fm.description ? String(fm.description) : '',
      date: fm.date || FALLBACK_DATE_ISO.slice(0, 10),
      dateFormatted: formatChineseDate(dateObj),
      dateISO: dateObj.toISOString(),
      year: dateObj.getUTCFullYear(),
      timestamp: dateObj.getTime(),
      cover: fm.cover ? String(fm.cover) : '',
      category: fm.category ? String(fm.category) : '未分类',
      words: `${rawWords} 字`,
      rawWords,
      headings: typeof mod.getHeadings === 'function' ? mod.getHeadings() : (mod.headings || [])
    };
  });

  // 按日期降序排序（最新在前）
  posts.sort((a, b) => b.timestamp - a.timestamp);

  return posts;
}

export function getAllPosts() {
  const postModules = import.meta.glob('../../posts/*.md', { eager: true });
  return processPosts(postModules);
}
