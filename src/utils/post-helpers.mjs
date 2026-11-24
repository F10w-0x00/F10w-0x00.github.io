// src/utils/post-helpers.mjs
// 纯 Node 兼容的文章辅助方法（日期解析、Slug 规范化、自动字数统计）

const FALLBACK_DATE_ISO = '2026-01-01T00:00:00.000Z';

export function normalizePostId(entryPath) {
  return String(entryPath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/index\.md$/i, '')
    .replace(/\.md$/i, '');
}

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

export function countWords(rawMarkdown) {
  if (typeof rawMarkdown !== 'string' || !rawMarkdown.trim()) return 0;

  const cleaned = rawMarkdown
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^```[^\n]*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~>#|]/g, ' ');

  const cjkMatches = cleaned.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || [];
  const withoutCjk = cleaned.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
  const latinMatches = withoutCjk.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];

  return cjkMatches.length + latinMatches.length;
}
