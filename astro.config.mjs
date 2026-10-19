// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Public pages are fully static (prerendered). Only /admin/* opts out with
  // `export const prerender = false` and runs on the Cloudflare Worker.
  output: 'static',
  // Prerender in Node so build-time secrets (service-role key) come from the
  // build environment; only on-demand /admin routes run inside workerd.
  adapter: cloudflare({ prerenderEnvironment: 'node', imageService: 'passthrough' }),
  // Auth lives in Supabase cookies; Astro sessions (and their KV binding) are not used.
  session: false,
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      // Build-time only. Service-role key bypasses RLS and never reaches the client.
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Runtime (admin panel). The anon key is RLS-bound; still kept server-side.
      SUPABASE_ANON_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
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
