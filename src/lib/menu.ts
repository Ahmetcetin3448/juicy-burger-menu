import { z } from 'zod';
import { MENU_SOURCE, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from 'astro:env/server';
import { menuSchema, type Category, type Product, type Settings } from './menuSchema';
import { fetchMenuFromSupabase } from './supabaseMenu';

export interface CategoryWithProducts extends Category {
  products: Product[];
}

export interface Menu {
  settings: Settings;
  /** Active categories with at least one publishable product, in sort order. */
  categories: CategoryWithProducts[];
}

/** A product is publishable only when it is active and has at least one price. */
export function isPublishable(product: Product): boolean {
  return product.is_active && (product.price_single !== null || product.price_menu !== null);
}

function fail(message: string): never {
  throw new Error(`Menu data is invalid:\n${message}`);
}

/**
 * Loads raw menu data at build time.
 * Default source is Supabase (service-role key, build environment only).
 * MENU_SOURCE=json reads src/data/menu.json instead, for local work without
 * database access. It must be set explicitly so a misconfigured deploy fails
 * loudly instead of silently shipping stale JSON prices.
 */
async function loadRaw(): Promise<unknown> {
  if (MENU_SOURCE === 'json') {
    const json = await import('../data/menu.json');
    return json.default;
  }

  const url = SUPABASE_URL;
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the build ' +
        '(or MENU_SOURCE=json to build from src/data/menu.json).',
    );
  }
  return fetchMenuFromSupabase(url, key);
}

/**
 * Validates the menu at build time. Any structural or referential problem
 * throws, which fails `astro build` before bad data can go live.
 */
export async function loadMenu(): Promise<Menu> {
  const parsed = menuSchema.safeParse(await loadRaw());
  if (!parsed.success) fail(z.prettifyError(parsed.error));

  const { settings, categories, products } = parsed.data;

  const slugs = new Set<string>();
  for (const category of categories) {
    if (slugs.has(category.slug)) fail(`duplicate category slug "${category.slug}"`);
    slugs.add(category.slug);
  }
  for (const product of products) {
    if (!slugs.has(product.category)) {
      fail(`product "${product.name_tr}" references unknown category "${product.category}"`);
    }
  }

  const bySortOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
    a.sort_order - b.sort_order;

  const grouped: CategoryWithProducts[] = [...categories]
    .filter((category) => category.is_active)
    .sort(bySortOrder)
    .map((category) => ({
      ...category,
      products: products
        .filter((product) => product.category === category.slug && isPublishable(product))
        .sort(bySortOrder),
    }))
    // Empty categories are never rendered.
    .filter((category) => category.products.length > 0);

  return { settings, categories: grouped };
}

export const menu: Menu = await loadMenu();
