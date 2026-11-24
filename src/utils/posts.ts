// src/utils/posts.ts
// 基于 Astro 5 Content Collections 的统一文章与首页书架查询层
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import {
  countWords,
  extractMarkdownHeadings,
  formatChineseDate,
  parseDate,
  resolveShelfMeta,
} from './post-helpers.mjs';

export interface ShelfPalette {
  band: string;
  bandFg: string;
  spineBg: string;
  spineFg: string;
  coverBg: string;
  coverFg: string;
  coverMuted: string;
  accent: string;
}

export interface ShelfItem {
  index: number;
  numberLabel: string;
  slug: string;
  url: string;
  type: 'book' | 'paper';
  typeLabel: string;
  group: string;
  postTitle: string;
  spineTitle: string;
  author: string;
  year: string;
  pages: number | null;
  spineWidth: number;
  heightScale: number;
  coverRatio: number;
  description: string;
  dateFormatted: string;
  dateISO: string;
  words: string;
  category: string;
  tags: string[];
  cover?: ImageMetadata;
  outline: string[];
  palette: ShelfPalette;
  order: number | null;
  timestamp: number;
}

export interface ShelfGroup {
  name: string;
  firstIndex: number;
  count: number;
}

export interface BlogPost {
  slug: string;
  entry: CollectionEntry<'blog'>;
  title: string;
  description: string;
  date: Date;
  dateFormatted: string;
  dateISO: string;
  year: number;
  timestamp: number;
  cover?: ImageMetadata;
  category: string;
  tags: string[];
  words: string;
  rawWords: number;
  draft: boolean;
}

// 莫兰迪书脊与精装封面色板（高对比度、深浅模式皆自然融洽）
const BOOK_PALETTES: ShelfPalette[] = [
  {
    band: '#4a6b7c',
    bandFg: '#f7f8f9',
    spineBg: '#f8f7f4',
    spineFg: '#1f2529',
    coverBg: '#f6f5f1',
    coverFg: '#1c2328',
    coverMuted: '#586670',
    accent: '#4a6b7c',
  },
  {
    band: '#a77763',
    bandFg: '#fbf8f6',
    spineBg: '#23201e',
    spineFg: '#f2ece6',
    coverBg: '#262321',
    coverFg: '#f4efe9',
    coverMuted: '#b7aba2',
    accent: '#c59580',
  },
  {
    band: '#416fae',
    bandFg: '#f5f8fc',
    spineBg: '#f1f4f8',
    spineFg: '#1b2636',
    coverBg: '#eef2f7',
    coverFg: '#1a2534',
    coverMuted: '#556880',
    accent: '#416fae',
  },
  {
    band: '#637a67',
    bandFg: '#f5f8f5',
    spineBg: '#242e27',
    spineFg: '#ecf1ed',
    coverBg: '#28332b',
    coverFg: '#eef3ef',
    coverMuted: '#a6b6a9',
    accent: '#87a38c',
  },
  {
    band: '#857894',
    bandFg: '#f8f6fa',
    spineBg: '#f4f1f7',
    spineFg: '#25212b',
    coverBg: '#f4f1f7',
    coverFg: '#24202a',
    coverMuted: '#655c72',
    accent: '#857894',
  },
  {
    band: '#b38b54',
    bandFg: '#fbf8f2',
    spineBg: '#f6f2e8',
    spineFg: '#2a241b',
    coverBg: '#f6f1e6',
    coverFg: '#2a231a',
    coverMuted: '#736552',
    accent: '#a67d45',
  },
];

// 论文抽印本（Bound Offprint / Monograph）专属温润纸张色板
const PAPER_PALETTES: ShelfPalette[] = [
  {
    band: '#a77763',
    bandFg: '#fdfaf8',
    spineBg: '#f5f2eb',
    spineFg: '#231f1d',
    coverBg: '#f6f3ec',
    coverFg: '#1f1d1b',
    coverMuted: '#686058',
    accent: '#9b6b57',
  },
  {
    band: '#5f7d86',
    bandFg: '#f6fafb',
    spineBg: '#f1f4f4',
    spineFg: '#1f292c',
    coverBg: '#f3f6f6',
    coverFg: '#1c2629',
    coverMuted: '#58696e',
    accent: '#54737c',
  },
  {
    band: '#7d738d',
    bandFg: '#faf8fc',
    spineBg: '#f4f2f6',
    spineFg: '#24202b',
    coverBg: '#f5f3f7',
    coverFg: '#221e28',
    coverMuted: '#665e73',
    accent: '#786d88',
  },
  {
    band: '#6d7e6c',
    bandFg: '#f7faf7',
    spineBg: '#f2f4f0',
    spineFg: '#212721',
    coverBg: '#f3f5f1',
    coverFg: '#1f261f',
    coverMuted: '#5d695c',
    accent: '#617460',
  },
];

function buildPalette(type: 'book' | 'paper', idx: number, customColor: string | null): ShelfPalette {
  const pool = type === 'paper' ? PAPER_PALETTES : BOOK_PALETTES;
  const base = pool[idx % pool.length];
  if (!customColor) return base;
  return {
    ...base,
    band: customColor,
    accent: customColor,
  };
}

export async function getAllPosts(options: { includeDrafts?: boolean } = {}): Promise<BlogPost[]> {
  const includeDrafts = options.includeDrafts ?? import.meta.env.DEV;
  const entries = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);

  const posts: BlogPost[] = entries.map((entry) => {
    const dateObj = parseDate(entry.data.date);
    const rawWords =
      typeof entry.data.words === 'number' && Number.isFinite(entry.data.words) && entry.data.words > 0
        ? Math.round(entry.data.words)
        : countWords(entry.body ?? '');

    return {
      slug: entry.id,
      entry,
      title: entry.data.title,
      description: entry.data.description,
      date: dateObj,
      dateFormatted: formatChineseDate(dateObj),
      dateISO: dateObj.toISOString(),
      year: dateObj.getUTCFullYear(),
      timestamp: dateObj.getTime(),
      cover: entry.data.cover,
      category: entry.data.category,
      tags: entry.data.tags ?? [],
      words: `${rawWords} 字`,
      rawWords,
      draft: entry.data.draft,
    };
  });

  // 按发布日期降序排序（最新在前），同日按 slug 稳定排序
  posts.sort((a, b) => b.timestamp - a.timestamp || b.slug.localeCompare(a.slug));

  return posts;
}

export async function getShelfData(options: { includeDrafts?: boolean } = {}): Promise<{
  items: ShelfItem[];
  groups: ShelfGroup[];
}> {
  const posts = await getAllPosts(options);

  const rawItems: Array<{
    post: BlogPost;
    meta: NonNullable<ReturnType<typeof resolveShelfMeta>>;
    shelfCover?: ImageMetadata;
  }> = [];

  for (const post of posts) {
    const shelfField = post.entry.data.shelf;
    const meta = resolveShelfMeta({
      tags: post.tags,
      shelf: shelfField,
      title: post.title,
      date: post.date,
    });
    if (!meta) continue;

    const shelfCover =
      shelfField && typeof shelfField === 'object' && 'cover' in shelfField ? shelfField.cover : undefined;

    rawItems.push({ post, meta, shelfCover });
  }

  // 分区排序：所有书籍集中在一侧，所有论文集中在另一侧；同区内部优先按显式 order 升序，其余按日期降序
  rawItems.sort((a, b) => {
    const aTypeRank = a.meta.type === 'paper' ? 1 : 0;
    const bTypeRank = b.meta.type === 'paper' ? 1 : 0;
    if (aTypeRank !== bTypeRank) return aTypeRank - bTypeRank;

    const aHas = a.meta.order !== null;
    const bHas = b.meta.order !== null;
    if (aHas && bHas) {
      return (a.meta.order as number) - (b.meta.order as number) || b.post.timestamp - a.post.timestamp;
    }
    if (aHas) return -1;
    if (bHas) return 1;
    return b.post.timestamp - a.post.timestamp || a.post.slug.localeCompare(b.post.slug);
  });

  let bookColorIdx = 0;
  let paperColorIdx = 0;

  const items: ShelfItem[] = rawItems.map(({ post, meta, shelfCover }, idx) => {
    const shelfType: 'book' | 'paper' = meta.type === 'paper' ? 'paper' : 'book';
    const colorIdx = shelfType === 'paper' ? paperColorIdx++ : bookColorIdx++;
    const palette = buildPalette(shelfType, colorIdx, meta.color);

    return {
      index: idx,
      numberLabel: String(idx + 1).padStart(2, '0'),
      slug: post.slug,
      url: `/blog/${post.slug}/`,
      type: shelfType,
      typeLabel: shelfType === 'paper' ? 'Paper' : 'Book',
      group: meta.group,
      postTitle: post.title,
      spineTitle: meta.spineTitle,
      author: meta.author,
      year: meta.year,
      pages: meta.pages,
      spineWidth: meta.spineWidth,
      heightScale: meta.heightScale,
      coverRatio: meta.coverRatio,
      description: post.description,
      dateFormatted: post.dateFormatted,
      dateISO: post.dateISO,
      words: post.words,
      category: post.category,
      tags: post.tags,
      cover: shelfCover ?? post.cover,
      outline: extractMarkdownHeadings(post.entry.body ?? ''),
      palette,
      order: meta.order,
      timestamp: post.timestamp,
    };
  });

  const groupMap = new Map<string, ShelfGroup>();
  items.forEach((item, idx) => {
    const existing = groupMap.get(item.group);
    if (existing) {
      existing.count += 1;
    } else {
      groupMap.set(item.group, { name: item.group, firstIndex: idx, count: 1 });
    }
  });

  return {
    items,
    groups: [...groupMap.values()],
  };
}
