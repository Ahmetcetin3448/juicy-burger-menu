# Supabase kurulumu (bir kez yapılır)

Sıra önemli. Hepsi Supabase panelinden yapılır, kod bilgisi gerekmez.

## 1. Şema

SQL Editor → New query → `migrations/0001_schema.sql` dosyasının tamamını
yapıştır → Run. Tablolar, RLS politikaları ve `product-images` bucket'ı oluşur.

## 2. Başlangıç verisi

SQL Editor → New query → `seed.sql` dosyasını yapıştır → Run.
7 kategori, 35 ürün ve malzeme sözlüğü yüklenir. Tekrar çalıştırmak güvenlidir,
mevcut satırlara dokunmaz.

`seed.sql` elle düzenlenmez; `src/data/menu.json` değişirse `npm run seed`
ile yeniden üretilir.

## 3. Admin kullanıcı

1. Authentication → Users → Add user → Create new user.
   E-posta ve şifre gir, "Auto Confirm User" işaretli olsun.
2. SQL Editor'da, e-postayı kendi adresinle değiştirerek çalıştır:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'sahibi@ornek.com';
   ```

   Bu listede olmayan hiçbir hesap yazamaz, giriş yapsa bile.

3. Authentication → Sign In / Providers → Email → **"Allow new users to sign up"
   kapat.** Panelde kayıt ekranı yoktur, dışarıdan hesap açılmasın.

## 4. Anahtarlar

Project Settings → API:

| Anahtar | Nerede kullanılır | Nereye girilir |
|---|---|---|
| Project URL | build + panel | Cloudflare: build variable **ve** Worker variable `SUPABASE_URL` |
| `anon` `public` | panel (tarayıcı) | Cloudflare: Worker variable `SUPABASE_ANON_KEY` |
| `service_role` | yalnızca build | Cloudflare: build variable `SUPABASE_SERVICE_ROLE_KEY` (secret) |

`service_role` anahtarı RLS'i atlar. Asla panele, tarayıcıya veya repoya girmez.
