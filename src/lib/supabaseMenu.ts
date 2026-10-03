import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const IMAGE_BUCKET = 'product-images';

/** PostgREST serialises numeric(10,2) as a string; the schema wants a number. */
function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error(`Invalid numeric value from database: "${value}"`);
  return parsed;
}

/**
 * Reads the whole menu from Supabase at build time with the service-role key.
 * Returns the raw shape of src/data/menu.json so the same Zod schema validates
 * both sources. Nothing here runs in the browser.
 */
export async function fetchMenuFromSupabase(url: string, serviceRoleKey: string): Promise<unknown> {
  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [categories, products, settings] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('*').order('sort_order'),
    supabase.from('settings').select('*').eq('id', 1).single(),
  ]);

  if (categories.error) throw new Error(`categories: ${categories.error.message}`);
  if (products.error) throw new Error(`products: ${products.error.message}`);
  if (settings.error) throw new Error(`settings: ${settings.error.message}`);

  const slugById = new Map(categories.data.map((row) => [row.id, row.slug]));
  const storage = supabase.storage.from(IMAGE_BUCKET);

  return {
    settings: {
      business_name: settings.data.business_name,
      currency: settings.data.currency,
      phone: settings.data.phone,
      address: settings.data.address,
      instagram: settings.data.instagram,
      working_hours: settings.data.working_hours,
      menu_includes_tr: settings.data.menu_includes_tr ?? '',
      menu_includes_en: settings.data.menu_includes_en ?? '',
      notice_tr: settings.data.notice_tr ?? '',
      notice_en: settings.data.notice_en ?? '',
    },
    categories: categories.data.map((row) => ({
      slug: row.slug,
      name_tr: row.name_tr,
      name_en: row.name_en,
      sort_order: row.sort_order,
      is_active: row.is_active,
    })),
    products: products.data.map((row) => ({
      category: slugById.get(row.category_id) ?? `<unknown category ${row.category_id}>`,
      sort_order: row.sort_order,
      name_tr: row.name_tr,
      name_en: row.name_en,
      weight_g: row.weight_g,
      price_single: toNumber(row.price_single),
      price_menu: toNumber(row.price_menu),
      ingredients_tr: row.ingredients_tr,
      ingredients_en: row.ingredients_en,
      note_tr: row.note_tr,
      note_en: row.note_en,
      image_path: row.image_path ? storage.getPublicUrl(row.image_path).data.publicUrl : null,
      badges: row.badges,
      allergens: row.allergens,
      allergens_confirmed: row.allergens_confirmed,
      is_active: row.is_active,
      is_sold_out: row.is_sold_out,
    })),
  };
}
