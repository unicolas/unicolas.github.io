import { resolve } from '$app/paths';
import { lastUpdated } from '$lib/helpers';
import type { Post } from '$lib/types';
import { DOMAIN } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

export const prerender = true;

export const GET: RequestHandler = async ({ fetch }) => {
  const response = await fetch(resolve('/api/posts'));
  const posts: Post[] = await response.json();
  const updated = lastUpdated(posts);
  const feed = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Blog | Nicolás Urquiola</title>
    <link rel="self" href="https://${DOMAIN}${resolve('/feed.atom')}" />
    <updated>${new Date(updated).toISOString()}</updated>
    <author>
      <name>Nicolás Urquiola</name>
    </author>
    <id>https://${DOMAIN}${resolve('/')}</id>
    ${posts
      .map(
        ({ title, slug, updated, date }) => `
    <entry>
      <title>${title}</title>
      <id>https://${DOMAIN}${resolve('/blog/[slug]', { slug })}</id>
      <link href="https://${DOMAIN}${resolve('/blog/[slug]', { slug })}" type="text/html" />
      <updated>${new Date(updated ?? date).toISOString()}</updated>
    </entry>`
      )
      .join('')}
  </feed>`;

  return new Response(feed, {
    headers: { 'Content-Type': 'application/atom+xml;charset=utf-8' }
  });
};
