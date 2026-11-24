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
      tags: z.array(z.string()).default([]),
      shelf: z
        .union([
          z.boolean(),
          z.enum(['book', 'paper']),
          z.object({
            type: z.enum(['book', 'paper']).optional(),
            domain: z.string().optional(),
            group: z.string().optional(),
            title: z.string().optional(),
            author: z.string().optional(),
            venue: z.string().optional(),
            year: z.union([z.string(), z.number()]).optional(),
            pages: z.number().int().positive().optional(),
            thickness: z
              .union([z.enum(['paper', 'thin', 'medium', 'thick']), z.number().min(8).max(110)])
              .optional(),
            color: z.string().optional(),
            cover: image().optional(),
            order: z.number().int().optional(),
          }),
        ])
        .optional(),
    }),
});

export const collections = { blog };
