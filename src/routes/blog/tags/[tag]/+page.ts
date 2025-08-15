import { resolve } from '$app/paths';
import type { Post } from '$lib/types';
import type { PageLoad } from './$types';

export const load = (async ({ fetch, params }) => {
  const response = await fetch(resolve('/api/posts'));
  const posts: Post[] = await response.json();
  return {
    posts: posts.filter((post) => post.tags.includes(`${params.tag}`)),
    tag: params.tag
  };
}) satisfies PageLoad;
