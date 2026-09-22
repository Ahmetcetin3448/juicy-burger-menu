import { z } from 'zod';
import { ALLERGENS, BADGES, DAYS } from '../i18n/ui';

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case');

const price = z.number().nonnegative().nullable();

export const categorySchema = z.object({
  slug,
  name_tr: z.string().min(1),
  name_en: z.string().min(1),
  sort_order: z.number().int(),
  is_active: z.boolean().default(true),
});

export const productSchema = z.object({
  category: slug,
  sort_order: z.number().int(),
  name_tr: z.string().min(1),
  name_en: z.string().min(1),
  weight_g: z.number().int().positive().nullable().default(null),
  // Two prices, both nullable. A product with neither is never published.
  price_single: price.default(null),
  price_menu: price.default(null),
  // Ingredients are tag arrays, never free text.
  ingredients_tr: z.array(z.string().min(1)).default([]),
  ingredients_en: z.array(z.string().min(1)).default([]),
  note_tr: z.string().nullable().default(null),
  note_en: z.string().nullable().default(null),
  image_path: z.string().nullable().default(null),
  badges: z.array(z.enum(BADGES)).default([]),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  allergens_confirmed: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_sold_out: z.boolean().default(false),
});

export const settingsSchema = z.object({
  business_name: z.string().default(''),
  currency: z.string().length(3).default('TRY'),
  phone: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  instagram: z.string().nullable().default(null),
  working_hours: z.partialRecord(z.enum(DAYS), z.string().min(1)).nullable().default(null),
  menuIncludes_tr: z.string().default(''),
  menuIncludes_en: z.string().default(''),
  notice_tr: z.string().default(''),
  notice_en: z.string().default(''),
});

export const menuSchema = z.object({
  settings: settingsSchema,
  categories: z.array(categorySchema),
  products: z.array(productSchema),
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type MenuData = z.infer<typeof menuSchema>;
