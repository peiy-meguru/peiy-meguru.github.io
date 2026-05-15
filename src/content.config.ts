import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    updated: z.date().optional(),
    category: z.string().default('uncategorized'),
    cover: z.string().optional(),
    sticky: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  posts: postsCollection,
};
