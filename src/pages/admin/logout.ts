import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase.auth.signOut();
  return redirect('/admin/login', 303);
};

// Logging out is a state change: only POST (from the header form) does it.
export const GET: APIRoute = ({ redirect }) => redirect('/admin', 303);
