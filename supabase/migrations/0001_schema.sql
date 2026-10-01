-- QR menu schema. Run once in the Supabase SQL Editor (see supabase/README.md).
-- Money is numeric(10,2) in TL units. Ingredients, badges and allergens are
-- text[] tag arrays, never free text.

-- ---------------------------------------------------------------------------
-- Admin allow-list. Only users listed here may write. Supabase "authenticated"
-- alone is not enough: with sign-ups open, anyone could become authenticated.
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_tr     text not null check (length(name_tr) > 0),
  name_en     text not null check (length(name_en) > 0),
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.ingredients (
  id                uuid primary key default gen_random_uuid(),
  name_tr           text unique not null check (length(name_tr) > 0),
  name_en           text not null default '',
  default_allergens text[] not null default '{}'
    check (default_allergens <@ '{gluten,laktoz,yumurta,findik,soya}'::text[]),
  updated_at        timestamptz not null default now()
);

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete restrict,
  name_tr       text not null check (length(name_tr) > 0),
  name_en       text not null check (length(name_en) > 0),

  -- Two prices (printed menu "TEK" / "MENÜ"). Both nullable. A product with
  -- neither is kept so the panel can list it as incomplete; it is never
  -- published because the build filters it out.
  price_single  numeric(10,2) check (price_single >= 0),
  price_menu    numeric(10,2) check (price_menu >= 0),

  weight_g      int check (weight_g > 0),

  ingredients_tr text[] not null default '{}',
  ingredients_en text[] not null default '{}',

  note_tr       text,
  note_en       text,

  image_path    text,
  badges        text[] not null default '{}'
    check (badges <@ '{yeni,acili,vejetaryen,sef-onerisi}'::text[]),
  allergens     text[] not null default '{}'
    check (allergens <@ '{gluten,laktoz,yumurta,findik,soya}'::text[]),
  allergens_confirmed boolean not null default false,

  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  is_sold_out   boolean not null default false,
  updated_at    timestamptz not null default now(),

  unique (category_id, name_tr)
);

create index products_category_sort_idx on public.products (category_id, sort_order);

create table public.settings (
  id                int primary key default 1 check (id = 1),
  business_name     text not null default '',
  logo_path         text,
  phone             text,
  address           text,
  instagram         text,
  working_hours     jsonb,
  currency          text not null default 'TRY' check (length(currency) = 3),
  menu_includes_tr  text,
  menu_includes_en  text,
  notice_tr         text,
  notice_en         text,
  last_published_at timestamptz,
  updated_at        timestamptz not null default now()
);

insert into public.settings (id) values (1);

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger ingredients_set_updated_at before update on public.ingredients
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security. Public: read active rows only. Admin: everything.
-- The build uses the service-role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.categories  enable row level security;
alter table public.ingredients enable row level security;
alter table public.products    enable row level security;
alter table public.settings    enable row level security;

create policy "admin reads admin_users" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

create policy "public reads active categories" on public.categories
  for select to anon, authenticated using (is_active);
create policy "admin writes categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin reads ingredients" on public.ingredients
  for select to authenticated using (public.is_admin());
create policy "admin writes ingredients" on public.ingredients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads active products" on public.products
  for select to anon, authenticated using (is_active);
create policy "admin writes products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads settings" on public.settings
  for select to anon, authenticated using (true);
create policy "admin writes settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: product images. Public read; admin write. The bucket itself caps
-- uploads at 200 KB and WebP only, matching the client-side resize rules.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 204800, '{image/webp}');

create policy "public reads product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "admin uploads product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin updates product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "admin deletes product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
