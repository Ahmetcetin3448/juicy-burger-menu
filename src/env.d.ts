/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Request-scoped Supabase client; only set on /admin routes. */
    supabase: import('./lib/supabaseServer').AdminSupabaseClient;
    /** Signed-in admin, or null. Set only when the user is in admin_users. */
    user: { id: string; email: string } | null;
  }
}
