import { base } from '$app/paths';
import type { Post } from '$lib/types';
import type { PageLoad } from './$types';

export const load = (async ({ fetch }) => {
  const response = await fetch(`${base}/api/posts`);
  const posts: Post[] = await response.json();
  return { posts: posts.slice(0, 2), tags: tags(posts) };
}) satisfies PageLoad;

const tags = (posts: Post[]) => {
  const count = posts
    .flatMap((p) => p.tags)
    .reduce(
      (tagMap, tag) => ({ ...tagMap, [tag]: 1 + (tagMap[tag] ?? 0) }),
      {} as { [t: string]: number }
    );
  return Object.keys(count).sort(
    (t1, t2) => count[t2] - count[t1] || t1.localeCompare(t2)
  );
};
