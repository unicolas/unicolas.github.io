import { base } from '$app/paths';
import { lastUpdated } from '$lib/helpers';
import type { Post } from '$lib/types';

export const prerender = true;

export const GET = async ({ fetch }) => {
  const response = await fetch(`${base}/api/posts`);
  const posts: Post[] = await response.json();
  const updated = lastUpdated(posts);
  const feed = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Blog | Nicolás Urquiola</title>
    <link rel="self" href="https://unicolas.github.io${base}/feed.atom" />
    <updated>${new Date(updated).toISOString()}</updated>
    <author>
      <name>Nicolás Urquiola</name>
    </author>
    <id>https://unicolas.github.io${base}</id>
    ${posts
      .map(
        (post) => `
    <entry>
      <title>${post.title}</title>
      <id>https://unicolas.github.io${base}/blog/${post.slug}</id>
      <link href="https://unicolas.github.io${base}/blog/${
          post.slug
        }" type="text/html" />
      <updated>${new Date(post.updated ?? post.date).toISOString()}</updated>
    </entry>`
      )
      .join('')}
  </feed>`;

  return new Response(feed, {
    headers: { 'Content-Type': 'application/atom+xml;charset=utf-8' }
  });
};
