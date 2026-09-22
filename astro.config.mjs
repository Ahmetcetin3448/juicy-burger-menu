// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Public pages are fully static; /admin (Phase 2) will opt into SSR.
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
