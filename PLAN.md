# QR Menü Sistemi — Ürün Planı ve Teknik Şartname

> Bu dosya Claude Code'a verilecek ana referanstır. Her fazın başında
> "PLAN.md'yi oku, Faz N'i plan modunda planla" diyerek başla.

---

## 1. Amaç

Burgerci için QR kod okutulduğunda açılan, hızlı yüklenen, iki dilli (TR/EN)
dijital menü. Sipariş ve ödeme YOK — sadece görüntüleme. İşletme sahibi
fiyat/ürün/fotoğraf güncellemelerini basit bir panelden kendi yapabilir.

### Başarı kriterleri (ölçülebilir)

| Kriter | Hedef |
|---|---|
| İlk açılış (4G, restoran içi) | < 1.5 sn LCP |
| Sayfa ağırlığı (ilk yük) | < 300 KB |
| Aylık işletme maliyeti | 0 TL (yalnızca alan adı, ~400 TL/yıl) |
| Fiyat güncelleme süresi | < 2 dk, kod bilgisi gerekmez |
| Lighthouse (mobil) | Performance ≥ 95, Accessibility ≥ 95 |

### Kapsam dışı (bilinçli olarak yapılmayacak)

- Sepet, sipariş, masa çağırma
- Online ödeme
- Stok takibi
- Mobil uygulama (QR → web, indirme yok)
- Çoklu şube (veri modeli engellemeyecek ama UI yapılmayacak)

---

## 1.5 Verilen kararlar

| Konu | Karar |
|---|---|
| Kapsam | Sadece görüntüleme. Sipariş/ödeme yok |
| Alan adı | Satın alınacak (Cloudflare Registrar). İşletme adı Faz 4'ten önce netleşmeli — QR'a basılan adres bir daha değişemez |
| Panel erişimi | Tek hesap (işletme sahibi). Rol/personel yok |
| Tema | Koyu tema, sarı vurgu |
| Dil | TR + EN |
| Kategori yapısı | **Sabit değil.** Aşağıya bak |
| Menü içeriği | Kesin değil, panelden yönetilecek |

### Kategoriler ve içerik tamamen kullanıcıya ait

`menu-seed.json`'daki 7 kategori **başlangıç verisidir, şema değildir.**
Sahibi panelden kategori ekler, siler, yeniden adlandırır, sıralar. İçecek,
tatlı, kahvaltı, çocuk menüsü, kampanya — hepsi sonradan açılabilir. Bu
yüzden kodda hiçbir yerde kategori adı, slug'ı veya sayısı varsayılmaz:

- Kategori listesi **her zaman** veritabanından gelir, sabit dizi yok
- `citir`, `burger` gibi slug'lar koşul olarak kullanılmaz
  (`if (category.slug === 'burger')` gibi bir satır yazılmaz)
- Arayüz 3 kategoriyle de 15 kategoriyle de çalışır; üst navigasyon şeridi
  taşarsa yatay kayar, kesilmez
- **Boş veya tamamı gizli kategori hiç render edilmez** — sahibi "İçecekler"
  kategorisini açıp ürün girmeye üşenirse site boş başlık göstermez
- Kategori silinmek istendiğinde içinde ürün varsa engellenir, "önce
  ürünleri taşı veya sil" denir (`on delete restrict`)
- Ürünün hangi alanlarının dolu olduğu da değişkendir: gramaj, içindekiler,
  fotoğraf, iki fiyattan biri — hepsi boş olabilir ve boş olan çizilmez

Aynı şey ürün alanları için de geçerli: seed'deki içindekiler listeleri
sahibinin değiştireceği taslaklardır, doğruluk kaynağı mutfaktır.

## 2. Mimari kararı

```
┌─────────────────────────────────────────────────────────┐
│  MÜŞTERİ (QR okutur)                                    │
│  → tamamen statik HTML, veritabanı sorgusu YOK          │
└────────────────────┬────────────────────────────────────┘
                     │
        Cloudflare Pages (ücretsiz, ticari kullanım izinli)
                     │
        ┌────────────┴────────────┐
        │  Astro projesi          │
        │  • /          → statik  │  build anında DB'den basılır
        │  • /en        → statik  │
        │  • /admin     → SSR     │  Supabase Auth ile korumalı
        └────────────┬────────────┘
                     │
              Supabase (ücretsiz)
              • Postgres  → ürün/kategori/fiyat
              • Storage   → ürün fotoğrafları
              • Auth      → tek admin kullanıcı
                     │
   "Yayınla" butonu → Cloudflare Deploy Hook → yeniden build
```

### Neden bu şekilde

- **Statik public sayfa:** Müşteri sayfası build anında basılır. Restoranda
  zayıf internette bile anında açılır, DB çökse menü çalışmaya devam eder.
- **Cloudflare Pages, Vercel değil:** Vercel'in ücretsiz Hobby planı ticari
  kullanıma kapalı. Cloudflare Pages ücretsiz planı ticari kullanıma açık ve
  bant genişliği sınırsız. Bu, "ucuz" hedefinin en kritik kararı.
- **Astro, Next.js değil:** Menü etkileşimsiz bir içerik sayfası. Astro
  varsayılan olarak sıfır JavaScript gönderir → en düşük sayfa ağırlığı.
- **Manuel "Yayınla" butonu:** Her kayıtta otomatik build yerine sahibin
  bilinçli yayınlaması. Yarım kalmış düzenleme müşteriye yansımaz, build
  kotası da boşa harcanmaz.

### Reddedilen alternatifler

- **Hazır QR menü SaaS'i (Menulux, Adisyo vb.):** aylık 200–600 TL, veri
  onların elinde, tasarım şablona sıkışık. 3 yılda 10–20 bin TL.
- **Google Sheets'i CMS olarak kullanmak:** panel bedava gelir ama fotoğraf
  yönetimi, doğrulama ve iki dil desteği çirkinleşir.
- **Menü verisini repoda JSON tutmak:** en ucuz ama sahibinin fiyat
  değiştirmek için repoya dokunması gerekir → kabul edilemez.

---

## 3. Veri modeli

```sql
-- kategoriler
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,        -- 'burgerler'
  name_tr     text not null,               -- 'Burgerler'
  name_en     text not null,               -- 'Burgers'
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

-- ürünler
create table products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references categories(id) on delete restrict,
  name_tr       text not null,
  name_en       text not null,

  -- ÇİFT FİYAT: basılı menüdeki TEK / MENÜ sütunları
  price_single  numeric(10,2) check (price_single >= 0),  -- nullable: fiyatı henüz girilmemiş ürün
  price_menu    numeric(10,2) check (price_menu   >= 0),  -- nullable: menüsü olmayan ürün (Çıtır)

  weight_g      int check (weight_g > 0),   -- 120, 240, 200... yoksa null

  -- İÇİNDEKİLER: düz metin DEĞİL, etiket dizisi
  ingredients_tr text[] not null default '{}',
  ingredients_en text[] not null default '{}',

  -- serbest metin, yalnızca hikâye/not gerekiyorsa (opsiyonel)
  note_tr       text,
  note_en       text,

  image_path    text,                      -- Supabase Storage yolu, null olabilir
  badges        text[] not null default '{}', -- 'yeni','acili','vejetaryen','sef-onerisi'
  allergens     text[] not null default '{}', -- 'gluten','laktoz','yumurta','findik','soya'
  allergens_confirmed boolean not null default false,

  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  is_sold_out   boolean not null default false,
  updated_at    timestamptz not null default now(),

  -- en az bir fiyat olmalı; ikisi de yoksa ürün yayınlanamaz
  constraint has_price check (price_single is not null or price_menu is not null)
);

-- işletme bilgisi (tek satır)
create table settings (
  id            int primary key default 1 check (id = 1),
  business_name  text not null,
  logo_path      text,
  phone          text,
  address        text,
  instagram      text,
  working_hours  jsonb,      -- { "mon": "11:00-23:00", ... }
  currency       text not null default 'TRY',
  -- "MENÜ" fiyatının neyi kapsadığı. Basılı menüde yazmıyor, sitede yazmalı.
  menu_includes_tr text,     -- "Menü fiyatı patates ve içecek içerir."
  menu_includes_en text,
  notice_tr      text,       -- "Fiyatlarımıza KDV dahildir."
  notice_en      text
);
```

**RLS politikası:** public rol yalnızca `select` (aktif kayıtlar), yazma
işlemleri sadece authenticated admin. Build sırasında service-role key
kullanılır ve bu key ASLA istemciye gitmez.

### Fiyat kuralı

Fiyat `numeric(10,2)` olarak tutulur, **kuruş değil TL** birimiyle.
Gösterimde `Intl.NumberFormat('tr-TR', { style:'currency', currency:'TRY',
maximumFractionDigits: 0 })` — burgerci fiyatları küsuratsızdır, `260 ₺`
şeklinde görünsün. Fiyat metni asla elle string birleştirilmez.

Çift fiyat gösterimi kuralları:

- İkisi de varsa: `Tek 260 ₺ · Menü 300 ₺` (menü fiyatı ikincil ağırlıkta)
- Sadece `price_single`: tek fiyat, etiket yok
- Sadece `price_menu`: `Menü 300 ₺`
- İkisi de `null`: ürün **yayınlanamaz**, panelde kırmızı uyarı, sitede görünmez
- "Menü fiyatı neyi içerir" açıklaması kategori başlığının altında bir kez
  gösterilir, her ürüne tekrar yazılmaz

### İçindekiler neden metin değil, etiket dizisi

Basılı menüde içindekiler virgülle ayrılmış bir liste ("120gr burger köfte,
cheddar, karamelize soğan, kıvırcık, domates, mor soğan, burger sos, turşu").
Bunu `text` olarak tutmak kolay olurdu ama `text[]` tutmak şunları bedavaya
getiriyor:

1. **Tutarlı gösterim** — her ürün aynı biçimde çipler halinde listelenir,
   sahibinin yazım tutarsızlığı ("Cheddar" / "cheddar" / "chedar") arayüze
   yansımaz.
2. **Alerjen önerisi** — panel, malzeme etiketlerinden alerjen tahmini yapıp
   sahibine *önerir* (cheddar → laktoz, mayonez → yumurta). Öneri, onay
   alınmadan yayınlanmaz (`allergens_confirmed`).
3. **Filtre** — "jalapeno içermeyenler", "laktozsuz" gibi filtreler sonradan
   sıfır şema değişikliğiyle eklenebilir.
4. **Kolay giriş** — panelde malzeme alanı otomatik tamamlamalı çip girişi
   olur. Sahibi "kıv" yazınca "kıvırcık" önerilir; 35 üründe aynı 40 malzeme
   dönüyor, her seferinde baştan yazmaz.
5. **Çeviri bir kez** — `ingredients_en` malzeme sözlüğünden türetilir,
   sahibinin her ürün için İngilizce cümle yazması gerekmez.

`weight_g` de bu yüzden ayrı sütun: basılı menüde gramaj malzeme listesinin
içine gömülü ("120gr burger köfte") ama aslında ürünün özelliği. Ayrı
tutulunca "120 gr" etiketi olarak öne çıkarılabilir ve gramaj değişince tek
alan güncellenir.

---

## 4. Fazlar

Her faz **tek başına yayına çıkabilir** ve sonunda commit atılır.
Bir fazı bitirmeden sonrakine geçilmez.

### Faz 0 — İçerik ve hazırlık (kod yok)

- [x] Menü metni basılı menüden çıkarıldı → **`menu-seed.json`**
      (7 kategori, 35 ürün, çift fiyat, içindekiler, İngilizce taslak)
- [ ] `menu-seed.json` içindeki **`reviewQueue`** maddeleri. Bunların
      **hepsi sonradan panelden düzeltilebilir** — Faz 1'i bloke eden
      yalnızca "yanlış bilgi" kategorisidir, "eksik bilgi" değil:

  **Faz 1'i bloke eder (yanlış görünür):**
  - Belirsiz okunan 3 kalem — BBQ Cajun tek fiyatı (230 mu 234 mü),
    "panketten kaşar", "turbo soğan". Yanlış fiyat asılı kalmasın
  - "Menü fiyatı neyi içerir" cümlesi — 40 TL farkın ne olduğu yazmazsa
    müşteri anlamıyor

  **Bloke etmez (eksik olan görünmez):**
  - Çıtır'ın 7 fiyatı → fiyatsız ürün otomatik yayınlanmaz, kategori
    fiyatlar girilene kadar gizli kalır
  - Cajun Dürüm / Vejeteryan Burger içindekileri → boş içindekiler satırı
    hiç render edilmez, ürün adı ve fiyatıyla görünür
  - Alerjenler → `allergens_confirmed` false olduğu sürece gösterilmez
  - Fotoğraflar → zaten hiçbiri yok, tasarım buna göre

  Panel (Faz 2) açıldıktan sonra bu listenin tamamı sahibinin işidir;
  "Eksikler listesi" ekranı bu maddeleri tek tek takip eder.
- [ ] İngilizce çevirilerin gözden geçirilmesi (taslak hazır)
- [ ] Logo (SVG veya en az 512px PNG)
- [ ] Alan adı satın alınması (Cloudflare Registrar, maliyetine satar)
- [x] Tema: koyu zemin, sarı vurgu (karar verildi)
- [ ] Basılı menü fotoğrafı repoya `docs/reference/menu-print.png` olarak
      konur — tasarım referansı. CLAUDE.md "Tasarım" bölümü buna atıf yapar
- [ ] Fotoğraflar: **hiç yok, beklemek gerekmiyor.** Faz 1 fotoğrafsız
      yayına çıkar; fotoğraflar Faz 2'den sonra panelden tek tek eklenir.
      Kötü fotoğraf, fotoğrafsızdan daha zararlıdır — telefonla masada
      çekilmiş karanlık fotoğraf konmaz

**Çıktı:** `menu-seed.json` → `src/data/menu.json`

### Faz 1 — Statik menü yayında (en kritik faz)

Veri henüz `src/data/menu.json` dosyasında sabit. Amaç: QR'ın çalıştığını
gerçek telefonda görmek.

- [x] Astro + TypeScript + Tailwind projesi kurulumu
- [x] `menu.json` için Zod şeması ve **build sırasında doğrulama**
      (geçersiz veri build'i patlatır, canlıya çıkmaz)
- [x] Menü sayfası: kategori başlıkları + ürün listesi
- [x] Sticky kategori navigasyonu (yatay kaydırmalı çip şeridi)
- [x] **Fotoğrafsız-öncelikli tasarım.** Menünün tamamı şu an fotoğrafsız ve
      fotoğraflar aylar içinde tek tek eklenecek. Tasarım hiç fotoğraf
      yokken de eksiksiz görünmeli, fotoğraf geldikçe iyileşmeli — tersi
      değil. Bu yüzden düzen fotoğraf ızgarası değil, **tipografik liste**:
      ürün adı güçlü, gramaj ve rozetler küçük etiket, içindekiler soluk
      tek satır metin (basılı menüdeki gibi virgülle), fiyatlar sağda
      hizalı. Fotoğraf varsa satırın soluna 72px kare olarak girer, yoksa
      satır kayma yapmadan kapanır. Boş gri kutu, "fotoğraf yok" ikonu
      veya yer tutucu görsel **kullanılmaz**
- [x] **Görsel yön: basılı menünün dijitali.** `docs/reference/menu-print.png`
      referans alınır. Kalın, dar, büyük harf başlıklar; satır listesi; kart
      yok, gradient yok, emoji yok. Ayrıntılı yasaklar CLAUDE.md "Tasarım"
      bölümünde — Faz 1'in çıkış kriterlerinden biri o listeye uymaktır
- [x] Zod şeması `_en` alanlarını **baştan** içerir; Faz 3'te şema
      değişmez, sadece `/en` rotası açılır
- [x] Alt bilgi: telefon (tıkla-ara), adres (haritada aç), çalışma saatleri
- [ ] Cloudflare Pages'e deploy + alan adı bağlanması
- [ ] **Gerçek telefonla restoranda test**

**Çıkış kriteri:** telefondan URL açılıyor, Lighthouse mobil ≥ 95.

### Faz 2 — Supabase + admin paneli

- [ ] Supabase projesi, şema migration'ları, RLS politikaları
- [ ] `menu.json` verisinin DB'ye taşınması (seed script)
- [ ] Build sırasında veriyi DB'den çekme (service-role key, `.env`)
- [ ] `/admin` — Supabase Auth ile e-posta+şifre girişi
- [ ] Panel ekranları:
  - **Panel telefon-öncelikli tasarlanır.** Sahibi tezgâh başında
    telefondan "tükendi" işaretleyecek, fiyat değiştirecek. 390px genişlik
    ana hedef, masaüstü ikincil
  - **Ürün listesi** — kategoriye göre gruplu, yukarı/aşağı ok ile sıralama
    (sürükle-bırak telefonda güvenilmez, kütüphane de istemez).
    Her satırda satır içi düzenlenebilir iki fiyat kutusu (Tek / Menü),
    "Tükendi" anahtarı ve fotoğraf küçük resmi (yoksa "Fotoğraf ekle"
    tıklanabilir alanı — panelde bu normaldir, public sitede yasaktır)
  - **Ürün ekle/düzenle formu** — alanlar sırayla:
    1. Ad (TR) · Ad (EN)
    2. Kategori
    3. Gramaj (opsiyonel, sayı)
    4. Tek fiyat · Menü fiyat (biri boş bırakılabilir)
    5. **İçindekiler** — otomatik tamamlamalı çip girişi. Enter veya virgül
       yeni çip açar. Mevcut tüm malzemeler öneri olarak gelir. Yeni malzeme
       yazılırsa sözlüğe eklenir ve İngilizcesi sorulur
    6. Rozetler (yeni / acılı / vejetaryen / şefin önerisi)
    7. Alerjenler — malzemelerden **önerilir**, sahibi onaylar
    8. Fotoğraf
    9. Not (opsiyonel serbest metin)
  - **Toplu fiyat güncelleme** — kategori seç, "tüm fiyatlara %8 ekle" veya
    "+20 TL", önizleme tablosu, onayla. Türkiye'de fiyatlar sık değişiyor;
    35 ürünü tek tek elle güncellemek sahibinin paneli terk etme sebebidir
  - **Malzeme sözlüğü** — malzeme adı + İngilizce karşılığı + varsayılan
    alerjen eşlemesi. "cheddar" yazımı düzeltilince 12 üründe düzelir
  - **Eksikler listesi** — fotoğrafı olmayan, fiyatı olmayan, İngilizcesi
    eksik, alerjeni onaylanmamış ürünler tek ekranda. Sahibi menüyü zaman
    içinde buradan tamamlar
  - **Kategori yönetimi** — ekle / yeniden adlandır (TR+EN) / sırala /
    gizle / sil. Sahibi istediği kadar kategori açabilir (İçecekler,
    Tatlılar, Kahvaltı, Kampanya...). İçinde ürün olan kategori silinemez
  - İşletme bilgileri ("Menü fiyatı neyi içerir" alanı dahil)
- [ ] Fotoğraf yükleme: **tarayıcıda canvas ile 1200px WebP'ye küçültülür**,
      sonra Storage'a gider (ücretsiz planda sunucu tarafı dönüşüm yok).
      Kare kırpma aracı (1:1) — sahibinin telefonla çektiği dikey fotoğraf
      ızgarayı bozmasın
- [ ] "Yayınla" butonu → Cloudflare Deploy Hook + son yayın zamanı gösterimi
- [ ] Panelde yayınlanmamış değişiklik varsa uyarı şeridi

**Çıkış kriteri:** kod bilmeyen biri fiyat değiştirip yayınlayabiliyor.

### Faz 3 — İki dil ve cila

- [ ] `/` (TR) ve `/en` rotaları, her ikisi de statik
- [ ] Dil değiştirme butonu, seçim `localStorage`'da hatırlanır
- [ ] `hreflang` etiketleri
- [ ] Alerjen ve rozet ikonları (metin etiketli, sadece ikon değil)
- [ ] Açık tema (`prefers-color-scheme: light`) — koyu tema ana temadır,
      açık tema ikincil; gündüz dış mekânda okunurluk için
- [ ] OG görseli ve meta etiketleri (WhatsApp'ta paylaşıldığında düzgün görünsün)
- [ ] Cloudflare Web Analytics (ücretsiz, çerezsiz, KVKK dostu)
- [ ] Erişilebilirlik: kontrast ≥ 4.5:1, min 16px gövde metni, dokunma
      hedefleri ≥ 44px

### Faz 4 — QR ve sahaya çıkış

- [ ] **Panelde "QR Kod" ekranı** — sahibinin ne zaman isterse baskıya hazır
      QR üretip indirebildiği yer. Detaylar aşağıda
- [ ] QR üretimi: hata düzeltme seviyesi **H**, ortada logo, SVG olarak
- [ ] Baskı: min **3×3 cm**, matte laminasyon (parlak yüzey flaş yansıtır)
- [ ] QR altına mutlaka URL metni yazılsın (kamera çalışmazsa elle yazılır)
- [ ] Masa dikmesi + pencere çıkartması + kasa yanı
- [ ] 3 farklı telefonla (eski Android dahil) ve akşam ışığında test
- [ ] Sahibine 1 sayfalık kullanım notu

#### Panel > QR Kod ekranı

Amaç: masa dikmesi yırtıldığında, yeni masa eklendiğinde veya vitrine
çıkartma istendiğinde sahibinin kimseye sormadan baskıya hazır dosya
alabilmesi. QR içeriği hiç değişmediği için bu bir "üretici" değil,
**indirme ekranı**.

- **URL kutusu salt okunurdur.** `PUBLIC_SITE_URL` ortam değişkeninden
  gelir, elle yazılamaz. Serbest metin alanı koymak, yanlış adres girilip
  50 adet basılması demektir — bu ekranın tek gerçek riski budur
- İndirilebilir çıktılar:
  - **SVG** (varsayılan, öne çıkarılmış) — vektör, 3 cm'de de 30 cm'de de
    net. Matbaaya gidecek dosya budur
  - **PNG 1024px** — WhatsApp, Instagram, hızlı paylaşım için
  - **A4 baskı sayfası** — sayfada 6 adet kesilebilir masa dikmesi, altında
    "Menümüz için okutun / Scan for our menu" ve site adresi yazılı.
    PDF kütüphanesi **kullanılmaz**: `/admin/qr/print` rotası + `@media
    print` stil sayfası, sahibi tarayıcıdan "Yazdır → PDF olarak kaydet"
    der. Sıfır bağımlılık, aynı sonuç
- QR'ın altında adresin **metin olarak** da yazması zorunlu (kamera
  çalışmazsa müşteri elle yazar)
- Ortada logo, hata düzeltme seviyesi H (logo QR'ın %30'unu kapatsa bile
  okunur)
- Ekranda kısa bir baskı notu: min 3×3 cm, mat laminasyon (parlak yüzey
  ışığı yansıtıp okumayı bozar)

**Maliyet:** SVG + PNG için ~1-2 saat. A4 PDF sayfası ile birlikte yarım
gün. Kütüphane `qrcode` (~20 KB) ve yalnızca `/admin` rotasında yüklenir —
müşteri tarafındaki menü sayfasına hiç dokunmaz, sayfa ağırlığı hedefi
etkilenmez.

---

## 5. Teknik kurallar

- **Bağımlılık eklemek yasak** — Astro, Tailwind, Supabase client, Zod
  dışında bir paket eklenecekse önce gerekçesi sorulur.
- **Animasyon kütüphanesi yok.** Geçişler CSS ile.
- **Font:** sistem font yığını veya tek bir variable font (`font-display:
  swap`, subset edilmiş). İkiden fazla font ağırlığı yüklenmez.
- **Görsel:** WebP, `loading="lazy"` (ilk ekrandakiler hariç), `width`/
  `height` her zaman verilir (layout shift sıfır olmalı).
- **Sır yönetimi:** service-role key ve deploy hook URL'i sadece Cloudflare
  ortam değişkenlerinde. Repoda `.env.example` bulunur, `.env` asla commit
  edilmez.
- **Erişilebilirlik regresyon olarak sayılır** — kontrastı bozan bir tasarım
  değişikliği kabul edilmez.

---

## 6. Riskler

| Risk | Karşı önlem |
|---|---|
| Supabase ücretsiz projesi hareketsizlikten duraklar | Public site statik olduğu için menü etkilenmez; panelde uyarı ve manuel uyandırma notu |
| Sahibi paneli kullanamaz | Faz 2'de "hızlı eylem" butonları (fiyat/tükendi) ana ekranda; form ikincil |
| Yanlış fiyat yayına çıkar | Zod doğrulama + yayın öncesi "değişecekler" özeti |
| Fotoğraflar sayfayı yavaşlatır | Yüklemede zorunlu küçültme, boyut tavanı 200 KB |
| Alan adı yenilenmeyi kaçırır → QR'lar ölür | Otomatik yenileme açılır, takvim hatırlatıcısı kurulur |
| Basılı QR'ın URL'i değişmek zorunda kalır | Alan adı kökü kullanılır, asla ücretsiz subdomain'e QR basılmaz |
| Her "Yayınla" bir build; Cloudflare ücretsiz plan ayda 500 build | 35 ürün için günde 10 yayın bile ayda 300. Panelde "son yayın" saati gösterilir; sahibi birkaç değişikliği biriktirip tek yayınlar. Build 1-2 dk sürer, panelde "yayınlanıyor…" durumu görünür |
| Menü "yapay zekâ üretti" gibi görünür | CLAUDE.md "Tasarım" yasak listesi; basılı menü referans; her fazın sonunda gerçek telefonda görsel kontrol — Lighthouse bunu ölçemez, insan gözü gerekir |
