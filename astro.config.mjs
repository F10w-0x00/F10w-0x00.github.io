import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://f10w-0x00.github.io',
  output: 'static',
  build: {
    format: 'directory'
  }
});
