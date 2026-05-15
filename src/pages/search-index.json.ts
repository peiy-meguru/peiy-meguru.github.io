// Generate search index for Fuse.js client-side search
import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const index = posts.map(post => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description || '',
    category: post.data.category || '',
    date: post.data.date.toISOString(),
    content: post.body?.substring(0, 500) || '',
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
