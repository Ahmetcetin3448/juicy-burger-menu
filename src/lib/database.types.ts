// Hand-written mirror of supabase/migrations/0001_schema.sql.
// Keep in sync when the schema changes. Numeric columns arrive as strings
// from PostgREST; see supabaseMenu.ts for the conversion.

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CategoryRow = {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  category_id: string;
  name_tr: string;
  name_en: string;
  price_single: string | null;
  price_menu: string | null;
  weight_g: number | null;
  ingredients_tr: string[];
  ingredients_en: string[];
  note_tr: string | null;
  note_en: string | null;
  image_path: string | null;
  badges: string[];
  allergens: string[];
  allergens_confirmed: boolean;
  sort_order: number;
  is_active: boolean;
  is_sold_out: boolean;
  updated_at: string;
};

export type IngredientRow = {
  id: string;
  name_tr: string;
  name_en: string;
  default_allergens: string[];
  updated_at: string;
};

export type SettingsRow = {
  id: number;
  business_name: string;
  logo_path: string | null;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  working_hours: Json | null;
  currency: string;
  menu_includes_tr: string | null;
  menu_includes_en: string | null;
  notice_tr: string | null;
  notice_en: string | null;
  last_published_at: string | null;
  updated_at: string;
};

export type AdminUserRow = {
  user_id: string;
  created_at: string;
};

type Generated<Row, Keys extends keyof Row> = Omit<Row, Keys> & Partial<Pick<Row, Keys>>;

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      categories: Table<
        CategoryRow,
        Generated<CategoryRow, 'id' | 'sort_order' | 'is_active' | 'updated_at'>,
        Partial<CategoryRow>
      >;
      products: Table<
        ProductRow,
        Generated<
          ProductRow,
          | 'id'
          | 'price_single'
          | 'price_menu'
          | 'weight_g'
          | 'ingredients_tr'
          | 'ingredients_en'
          | 'note_tr'
          | 'note_en'
          | 'image_path'
          | 'badges'
          | 'allergens'
          | 'allergens_confirmed'
          | 'sort_order'
          | 'is_active'
          | 'is_sold_out'
          | 'updated_at'
        >,
        Partial<ProductRow>
      >;
      ingredients: Table<
        IngredientRow,
        Generated<IngredientRow, 'id' | 'name_en' | 'default_allergens' | 'updated_at'>,
        Partial<IngredientRow>
      >;
      settings: Table<SettingsRow, Generated<SettingsRow, keyof SettingsRow>, Partial<SettingsRow>>;
      admin_users: Table<AdminUserRow, Generated<AdminUserRow, 'created_at'>, Partial<AdminUserRow>>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
