import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabaseServer';

const ADMIN_PREFIX = '/admin';
const LOGIN_PATH = '/admin/login';

/**
 * Guards every /admin route. A request passes only when the session belongs
 * to a user listed in admin_users; "authenticated" alone is not enough.
 * Public (prerendered) pages never reach the Supabase code path.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (pathname !== ADMIN_PREFIX && !pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    return next();
  }

  const supabase = createSupabaseServerClient(context);
  context.locals.supabase = supabase;
  context.locals.user = null;

  // getUser() validates the token with Supabase; getSession() would only read the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (isAdmin === true) {
      context.locals.user = { id: user.id, email: user.email ?? '' };
    }
  }

  if (!context.locals.user && pathname !== LOGIN_PATH) {
    return context.redirect(LOGIN_PATH, 303);
  }

  const response = await next();
  // Panel responses carry session cookies and private data: never cache.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
