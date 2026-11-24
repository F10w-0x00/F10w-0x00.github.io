// src/utils/posts.ts
// 基于 Astro 5 Content Collections 的统一文章查询层
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { countWords, formatChineseDate, parseDate } from './post-helpers.mjs';

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
  words: string;
  rawWords: number;
  draft: boolean;
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
      words: `${rawWords} 字`,
      rawWords,
      draft: entry.data.draft,
    };
  });

  // 按发布日期降序排序（最新在前），同日按 slug 稳定排序
  posts.sort((a, b) => b.timestamp - a.timestamp || b.slug.localeCompare(a.slug));

  return posts;
}
