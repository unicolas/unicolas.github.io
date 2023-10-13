import { json } from '@sveltejs/kit';
import type { Post, Paths } from '$lib/types';

export const prerender = true;

export async function GET() {
  const paths: Paths = import.meta.glob('/src/lib/posts/*.md', { eager: true });
  const posts = Object.keys(paths)
    .reduce((acc: Post[], path) => {
      const metadata = paths[path].metadata;
      const slug = path.split('/').at(-1)?.replace('.md', '');
      return metadata?.published && slug
        ? [...acc, { ...metadata, slug }]
        : acc;
    }, [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return json(posts);
}
