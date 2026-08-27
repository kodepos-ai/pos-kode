import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',

  adapter: cloudflare(),

  site:
    process.env.SITE_URL ||
    'https://pos-kode.pages.dev',

  integrations: [
    sitemap({
      customSitemaps: [
        'https://pos-kode.pages.dev/wilayah-sitemap.xml'
      ]
    })
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  },

  vite: {
    build: {
      target: 'esnext'
    }
  }
});
