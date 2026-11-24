// src/content.config.ts
// Astro 5 Content Layer：统一托管根目录 posts/（支持「一文一盒」与单文件 .md）
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { normalizePostId } from './utils/post-helpers.mjs';

const blog = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/assets/**'],
    base: './posts',
    generateId: ({ entry }) => normalizePostId(entry),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1, '文章标题 title 不能为空'),
      description: z.string().default(''),
      date: z.coerce.date(),
      category: z.string().default('未分类'),
      cover: image().optional(),
      words: z.number().int().positive().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
