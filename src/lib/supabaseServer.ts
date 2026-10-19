import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from 'astro:env/server';
import type { AstroCookies } from 'astro';
import type { Database } from './database.types';

export type AdminSupabaseClient = SupabaseClient<Database>;

interface RequestContext {
  request: Request;
  cookies: AstroCookies;
  url: URL;
}

/**
 * Supabase client for on-demand /admin requests. Uses the anon key (RLS
 * applies) and keeps the session in httpOnly cookies. One client per request.
 */
export function createSupabaseServerClient({ request, cookies, url }: RequestContext): AdminSupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set for the admin panel.');
  }

  const secure = url.protocol === 'https:';

  // Cookies written during this request. @supabase/ssr decides what to delete
  // by looking at getAll(), so a session set and then revoked within the same
  // request (sign-in followed by sign-out for a non-admin) must be visible here.
  const written = new Map<string, string | null>();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
    cookies: {
      getAll() {
        const all = new Map<string, string>();
        for (const { name, value } of parseCookieHeader(request.headers.get('cookie') ?? '')) {
          if (value !== undefined) all.set(name, value);
        }
        for (const [name, value] of written) {
          if (value === null) all.delete(name);
          else all.set(name, value);
        }
        return [...all].map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          written.set(name, options.maxAge === 0 || value === '' ? null : value);
          cookies.set(name, value, {
            path: options.path ?? '/',
            maxAge: options.maxAge,
            expires: options.expires,
            domain: options.domain,
            sameSite: 'lax',
            httpOnly: true,
            secure,
          });
        }
      },
    },
  });
}
