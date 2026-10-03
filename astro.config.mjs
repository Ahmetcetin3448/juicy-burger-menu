// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Public pages are fully static; /admin (Phase 2) will opt into SSR.
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      // Build-time only. Service-role key bypasses RLS and never reaches the client.
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Local escape hatch: build from src/data/menu.json. Never set in Cloudflare.
      MENU_SOURCE: envField.enum({
        values: ['supabase', 'json'],
        context: 'server',
        access: 'secret',
        default: 'supabase',
      }),
    },
  },
});
