import adapter from '@sveltejs/adapter-static';
import { mdsvex, escapeSvelte } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/kit/vite';
import shiki from 'shiki';
import fs from 'fs';
import remarkFootnotes from 'remark-footnotes';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      highlight: {
        highlighter: async (code, lang = 'text') => {
          const highlighter = await shiki.getHighlighter({
            theme: JSON.parse(fs.readFileSync('./one-dark-pro.json', 'utf-8'))
          });
          const html = escapeSvelte(highlighter.codeToHtml(code, { lang }));
          return `{@html \`${html}\` }`;
        }
      },
      smartypants: { quotes: false },
      layout: './src/routes/layout.md.svelte',
      remarkPlugins: [remarkFootnotes]
    })
  ],
  kit: {
    adapter: adapter(),
    prerender: {
      entries: ['*', '/blog/']
    },
    paths: {
      base: dev ? '' : process.env.BASE_PATH
    }
  }
};

export default config;
