import adapter from '@sveltejs/adapter-static';
import { mdsvex, escapeSvelte } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { bundledLanguages, getHighlighter } from 'shiki';
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
          const highlighter = await getHighlighter({
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
          const html = escapeSvelte(
            highlighter.codeToHtml(code, { lang, theme: 'Carbon' })
          );
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
