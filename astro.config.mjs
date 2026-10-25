import { defineConfig } from 'astro/config';
import rehypeBlogContent from './src/plugins/rehype-blog-content.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://f10w-0x00.github.io',
  output: 'static',
  build: {
    format: 'directory'
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      wrap: false
    },
    rehypePlugins: [rehypeBlogContent]
  }
});
