import { base } from '$app/paths';
import { lastUpdated } from '$lib/helpers';
import type { Post } from '$lib/types';

export const prerender = true;

export const GET = async ({ fetch }) => {
  const response = await fetch(`${base}/api/posts`);
  const posts: Post[] = await response.json();
  const updated = lastUpdated(posts);
  const sitemap = `
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="https://www.w3.org/1999/xhtml"
			xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
		>
    <url>
      <loc>https://unicolas.github.io${base}</loc>
      <lastmod>${updated}</lastmod>
    </url>
    <url>
      <loc>https://unicolas.github.io${base}/blog</loc>
      <lastmod>${updated}</lastmod>
    </url>
    ${posts
      .map(
        (post) => `
      <url>
        <loc>https://unicolas.github.io${base}/blog/${post.slug}</loc>
        <lastmod>${new Date(post.updated ?? post.date).toISOString()}</lastmod>
      </url>`
      )
      .join('')}
		</urlset>`.trim();

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
};
