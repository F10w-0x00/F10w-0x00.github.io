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

export function formatChineseDate(dateInput, referenceYear = new Date().getUTCFullYear()) {
  if (!dateInput) return '';
  const d = parseDate(dateInput);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return y === referenceYear ? `${m}月${day}日` : `${y}年${m}月${day}日`;
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

const PAPER_TAGS = new Set(['paper', 'papers', '论文', '文献', '预印本', 'arxiv']);
const BOOK_TAGS = new Set(['book', 'books', '书', '书籍', '读书', '书评', '读书笔记', 'reading']);

export function extractMarkdownHeadings(rawMarkdown, maxCount = 12) {
  if (typeof rawMarkdown !== 'string' || !rawMarkdown.trim()) return [];

  const withoutCode = rawMarkdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '');

  const cleanHeadingText = (raw) =>
    raw
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~]/g, '')
      .replace(/\s+#+\s*$/, '')
      .trim();

  const h2s = [];
  const h3s = [];

  for (const line of withoutCode.split(/\r?\n/)) {
    const m2 = line.match(/^##\s+(.+)$/);
    if (m2) {
      const text = cleanHeadingText(m2[1]);
      if (text) h2s.push(text);
      continue;
    }
    const m3 = line.match(/^###\s+(.+)$/);
    if (m3) {
      const text = cleanHeadingText(m3[1]);
      if (text) h3s.push(text);
    }
  }

  const chosen = h2s.length >= 3 ? h2s : [...h2s, ...h3s];
  return chosen.slice(0, maxCount);
}

/**
 * @param {{ tags?: string[], shelf?: unknown, title?: string, date?: Date | string | number }} [opts]
 */
export function resolveShelfMeta({ tags = [], shelf, title = '', date } = {}) {
  if (shelf === false) return null;

  const normalizedTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];

  const hasPaperTag = normalizedTags.some((t) => PAPER_TAGS.has(t));
  const hasBookTag = normalizedTags.some((t) => BOOK_TAGS.has(t));
  const isObjectShelf = Boolean(shelf && typeof shelf === 'object');
  const isExplicitShelf = shelf === true || shelf === 'book' || shelf === 'paper' || isObjectShelf;

  if (!isExplicitShelf && !hasPaperTag && !hasBookTag) {
    return null;
  }

  const shelfObj = isObjectShelf ? shelf : {};
  let type;
  if (shelf === 'paper' || shelfObj.type === 'paper') {
    type = 'paper';
  } else if (shelf === 'book' || shelfObj.type === 'book') {
    type = 'book';
  } else if (hasPaperTag && !hasBookTag) {
    type = 'paper';
  } else {
    type = 'book';
  }

  const yearStr =
    shelfObj.year !== undefined && shelfObj.year !== null && String(shelfObj.year).trim()
      ? String(shelfObj.year).trim()
      : String(parseDate(date).getUTCFullYear());

  const group =
    typeof shelfObj.group === 'string' && shelfObj.group.trim()
      ? shelfObj.group.trim()
      : type === 'paper'
        ? 'Papers'
        : 'Books';

  const spineTitle =
    typeof shelfObj.title === 'string' && shelfObj.title.trim() ? shelfObj.title.trim() : String(title).trim();

  const author =
    typeof shelfObj.author === 'string' && shelfObj.author.trim()
      ? shelfObj.author.trim()
      : typeof shelfObj.venue === 'string' && shelfObj.venue.trim()
        ? shelfObj.venue.trim()
        : yearStr;

  const color =
    typeof shelfObj.color === 'string' && shelfObj.color.trim() ? shelfObj.color.trim() : null;

  const order =
    typeof shelfObj.order === 'number' && Number.isFinite(shelfObj.order) ? Math.round(shelfObj.order) : null;

  const pages =
    typeof shelfObj.pages === 'number' && Number.isFinite(shelfObj.pages) && shelfObj.pages > 0
      ? Math.round(shelfObj.pages)
      : null;

  const thickness =
    typeof shelfObj.thickness === 'number' || typeof shelfObj.thickness === 'string'
      ? shelfObj.thickness
      : null;

  const { spineWidth, heightScale, coverRatio } = computeShelfDimensions({ type, pages, thickness });

  return {
    type,
    group,
    spineTitle,
    author,
    year: yearStr,
    pages,
    thickness,
    spineWidth,
    heightScale,
    coverRatio,
    color,
    order,
  };
}

/**
 * 根据类型（书 / 论文）、真实页数或手动档位计算真实物理厚度与开本比例
 * - 论文：真实纤薄纸叠（10px – 18px），不假装厚书
 * - 书籍：真实精装厚度阶梯（38px 薄书 – 64px 中厚书 – 84px 砖头书）
 * @param {{ type?: string, pages?: number | null, thickness?: string | number | null }} [opts]
 */
export function computeShelfDimensions({ type = 'book', pages = null, thickness = null } = {}) {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const isPaper = type === 'paper';

  let spineWidth;
  if (typeof thickness === 'number' && Number.isFinite(thickness)) {
    spineWidth = Math.round(clamp(thickness, isPaper ? 8 : 32, isPaper ? 24 : 92));
  } else if (typeof thickness === 'string') {
    const presetMap = { paper: 12, thin: 42, medium: 60, thick: 80 };
    spineWidth = presetMap[thickness.toLowerCase()] ?? (isPaper ? 12 : 56);
  } else if (typeof pages === 'number' && Number.isFinite(pages) && pages > 0) {
    if (isPaper) {
      spineWidth = Math.round(clamp(8 + Math.log2(Math.max(pages, 2)) * 1.15, 10, 18));
    } else {
      spineWidth = Math.round(clamp(28 + Math.sqrt(Math.max(pages, 40)) * 1.46, 38, 86));
    }
  } else {
    spineWidth = isPaper ? 12 : 56;
  }

  // 论文采用 Letter/A4 略高开本，书籍随厚薄自然微调高度，全部底边齐平搁板基准线
  let heightScale;
  if (isPaper) {
    heightScale = 1.03;
  } else if (spineWidth >= 74) {
    heightScale = 1.01;
  } else if (spineWidth <= 46) {
    heightScale = 0.94;
  } else {
    heightScale = 0.98;
  }

  const coverRatio = isPaper ? 0.77 : 0.74;

  return { spineWidth, heightScale, coverRatio };
}
