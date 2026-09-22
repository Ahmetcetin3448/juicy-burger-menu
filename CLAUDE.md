# CLAUDE.md

Bu repo bir burgerci için QR menü sistemi. Ürün planı ve teknik şartname:
**`PLAN.md`** — her oturumun başında onu oku.

## Çalışma şekli

- Benimle **Türkçe** konuş. Kod, değişken adları ve yorumlar İngilizce.
- Kod yazmadan önce planı sun, onayımı bekle. Onaysız dosya oluşturma.
- Tek seferde **tek faz.** PLAN.md'deki fazlar sırayla yapılır, atlanmaz.
- Faz bitince kutuları PLAN.md'de işaretle ve commit at.
- Bir karar belirsizse **varsayım yapıp devam etme, sor.** Özellikle:
  tasarım tercihi, fiyat biçimi, yeni bağımlılık, veri modeli değişikliği.
- İstemediğim bir özelliği "faydalı olur" diye ekleme. PLAN.md'de olmayan
  şey yapılmaz.

## Stack (değiştirilmez)

- Astro + TypeScript + Tailwind CSS
- Supabase (Postgres + Storage + Auth)
- Cloudflare Pages (deploy)
- Zod (veri doğrulama)

**Önceden onaylı paketler** — bunlar için sorma, doğrudan kur:
`@astrojs/cloudflare`, Astro'nun resmi Tailwind entegrasyonu,
`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `qrcode` (yalnızca
`/admin` QR ekranı, Faz 4).

Bunların dışında **her paket için önce sor** ve alternatifini söyle.
React, Next.js, animasyon kütüphanesi, UI kit, ikon paketi, state manager,
ORM, PDF kütüphanesi, sürükle-bırak kütüphanesi **eklenmeyecek**.

## Kod kuralları

- TypeScript `strict`. `any` kullanılmaz.
- Public sayfalar **prerender** edilir (`export const prerender = true`).
  Sadece `/admin` SSR'dır.
- Public sayfalarda istemci tarafı JavaScript yalnızca gerçekten gerekliyse
  (dil değiştirme, kategori kaydırma) ve Astro island olarak eklenir.
- Para: veritabanında `numeric(10,2)`, kodda `number` (TL birimi).
  Gösterim **her zaman** `formatPrice()` yardımcı fonksiyonuyla yapılır,
  elle string birleştirme yasak.
- **Her ürünün iki fiyatı var:** `price_single` (Tek) ve `price_menu` (Menü).
  İkisi de nullable. Tek fiyatlı model varsayma. Gösterim kuralları
  PLAN.md "Fiyat kuralı" bölümünde — oradan sapma.
- **İçindekiler `text[]`**, serbest metin değil. Malzeme listesini tek string
  olarak tutma veya virgülle birleştirip kaydetme.
- Alerjen alanı malzemeden **otomatik doldurulmaz.** Panel önerir,
  `allergens_confirmed` true olmadan sitede alerjen gösterilmez.
- **Kategoriler sabit değil.** Kodda kategori adı, slug'ı veya sayısı
  varsayma. `if (slug === 'burger')` gibi bir satır yazma, sabit kategori
  dizisi tanımlama. Liste her zaman veriden gelir; 3 kategoriyle de 15
  kategoriyle de çalışmalı. Boş kategori hiç render edilmez.
- Ürünün her alanı boş olabilir (gramaj, içindekiler, fotoğraf, iki
  fiyattan biri). Public sitede boş alan çizilmez — "—", "belirtilmemiş",
  boş kutu, yer tutucu görsel yok. (Admin panelde "Fotoğraf ekle" gibi
  tıklanabilir boş alanlar normaldir, bu kural sadece müşteri sayfası için.)
- Çok dil: her metin alanı `_tr` / `_en` çiftidir. Çeviri anahtarı sistemi
  kurulmaz, içerik veritabanından gelir; sadece arayüz etiketleri için
  `src/i18n/ui.ts` sözlüğü kullanılır.
- Dosya adları: bileşenler `PascalCase.astro`, yardımcılar `camelCase.ts`.
- Admin panel **telefonda kullanılacak.** Sahibi tezgâh başında telefondan
  "tükendi" işaretleyecek. Her panel ekranı önce 390px genişlikte tasarlanır,
  masaüstü ikincildir. Sürükle-bırak yerine yukarı/aşağı ok butonları.

## Tasarım — müşteri sayfası

Referans: `docs/reference/menu-print.png` — işletmenin basılı menüsü.
Hedef, **bu menünün dijitale taşınmış hâli.** Bir teknoloji ürünü değil,
bir burgercinin menüsü.

Koyu zemin, sarı vurgu. Renkler `:root` üzerinde token olarak tanımlanır
(`--bg`, `--surface`, `--text`, `--muted`, `--accent`), doğrudan hex
yazılmaz. Açık tema `prefers-color-scheme` ile ikinci sırada desteklenir.
Kontrast her iki temada da ≥ 4.5:1.

**Şunları yapma** — bunlar sayfayı "yapay zekâ üretti" gibi gösterir:

- Gradient arka plan, glassmorphism, blur, neon parıltı
- Her şeyi kart yapmak: gölgeli, yuvarlatılmış, kenarlıklı kutular içinde
  ürünler. Ürünler **liste satırıdır**, kart değil
- Emoji (🍔🔥✨) — hiçbir yerde, rozetlerde bile
- Her satırda ikon. İkon yalnızca alerjen ve rozet için, o da metinle birlikte
- Inter / Roboto / varsayılan Tailwind font yığını. Ürün adları için
  basılı menüdeki gibi **kalın, dar (condensed), büyük harf** bir başlık
  fontu; gövde için sistem fontu. Tek bir subset woff2, < 30 KB
- Hero alanı, karşılama metni, "Hoş geldiniz" — QR okutan kişi menüyü
  görmek istiyor, ilk ekranda ilk kategori ve ilk ürünler görünmeli
- İçindekileri çip/etiket olarak göstermek. Public sitede içindekiler
  basılı menüdeki gibi **virgülle ayrılmış, küçük, soluk tek satır** metin.
  (Çip görünümü yalnızca admin paneldeki giriş alanında.)
- Sarıyı her yerde kullanmak. Sarı: aktif kategori, fiyat veya bir vurgu —
  tek bir rol seç, onunla kal
- Ortalanmış metin. Menü sola hizalı okunur, fiyat sağa
- `rounded-2xl`, `shadow-lg`, `backdrop-blur` gibi Tailwind refleksleri
- Yükleme animasyonu, skeleton, fade-in. Sayfa statik, anında gelir

**Şunları yap:**

- Kategori başlıkları büyük, kalın, büyük harf — basılı menüdeki gibi
- Ürün satırı: ad (kalın) · gramaj ve rozetler (küçük) / içindekiler
  (soluk) / fiyatlar sağda hizalı, aynı satırda
- Satırlar arasında ince ayırıcı çizgi, kutu değil
- Sıkı dikey ritim; 35 ürün 2-3 ekran kaydırmayla bitmeli
- Dokunma hedefleri ≥ 44px ama görsel olarak hafif

## Yapmaman gerekenler

- `.env` dosyasını commit etmek
- Supabase **service-role** key'ini istemci tarafına sızdırmak
  (yalnızca build script'i ve SSR admin rotası kullanır)
- Görseli boyut küçültmeden Storage'a yüklemek (tavan: 1200px, 200 KB, WebP)
- `<img>` etiketini `width`/`height` olmadan yazmak
- Kontrastı 4.5:1 altına düşüren renk kullanmak
- Placeholder/lorem ipsum içerikle commit atmak
- `PLAN.md`'nin kapsam dışı listesindeki bir şeyi "faydalı olur" diye eklemek

## Komutlar

```bash
npm run dev        # yerel geliştirme
npm run build      # build + Zod veri doğrulaması (veri bozuksa patlar)
npm run check      # astro check + tsc
npm run seed       # menu.json -> Supabase (yalnızca Faz 2'de bir kez)
```

Commit öncesi `npm run check && npm run build` geçmeli.

## Commit biçimi

`faz1: kategori navigasyonu eklendi` — kısa, Türkçe, fazı belirten önek.
