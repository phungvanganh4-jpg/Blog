import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  // 以下划线开头的文件（比如 _template.md）不会被当成文章
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** 所属系列的 key（见 src/site.config.ts 的 seriesMeta） */
    series: z.string().optional(),
    /** 系列中的第几篇；同时作为定理编号的前缀 */
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
