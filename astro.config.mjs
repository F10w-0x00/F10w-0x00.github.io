import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import postAttachments from './src/integrations/post-attachments.mjs';
import rehypeBlogContent from './src/plugins/rehype-blog-content.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://f10w-0x00.github.io',
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [postAttachments()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeBlogContent],
  },
});
