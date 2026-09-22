import { z } from 'zod';
import raw from '../data/menu.json';
import { menuSchema, type Category, type Product, type Settings } from './menuSchema';

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
  throw new Error(`menu.json is invalid:\n${message}`);
}

/**
 * Validates src/data/menu.json at build time. Any structural or referential
 * problem throws, which fails `astro build` before bad data can go live.
 */
export function loadMenu(): Menu {
  const parsed = menuSchema.safeParse(raw);
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

export const menu: Menu = loadMenu();
