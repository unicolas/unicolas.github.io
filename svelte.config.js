import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import { escapeSvelte, mdsvex } from 'mdsvex';
import { dirname, resolve } from 'path';
import remarkFootnotes from 'remark-footnotes';
import { bundledLanguages, createHighlighter } from 'shiki';
import { fileURLToPath } from 'url';

const dev = process.argv.includes('dev');
const dir = dirname(fileURLToPath(import.meta.url));

const highlighter = await createHighlighter({
  themes: [JSON.parse(fs.readFileSync('./carbon.json', 'utf-8'))],
  langs: [
    {
      ...JSON.parse(fs.readFileSync('./class.st.json', 'utf-8'))
    },
    {
      ...JSON.parse(fs.readFileSync('./st.json', 'utf-8'))
    },
    ...Object.keys(bundledLanguages)
  ]
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      highlight: {
        highlighter: async (code, lang = 'text') => {
          const html = escapeSvelte(
            highlighter.codeToHtml(code, { lang, theme: 'Carbon' })
          );
          return `{@html \`${html}\` }`;
        }
      },
      smartypants: { quotes: false },
      layout: resolve(dir, 'src/routes/layout.md.svelte'),
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
