import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ibanezar.github.io',
  base: '/Fotosvetovalec',
  trailingSlash: 'never',
  integrations: [sitemap()],
});
