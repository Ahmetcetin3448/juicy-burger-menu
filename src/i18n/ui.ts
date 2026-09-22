export type Lang = 'tr' | 'en';

export const LANGS: readonly Lang[] = ['tr', 'en'] as const;

export const BADGES = ['yeni', 'acili', 'vejetaryen', 'sef-onerisi'] as const;
export type Badge = (typeof BADGES)[number];

export const ALLERGENS = ['gluten', 'laktoz', 'yumurta', 'findik', 'soya'] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

interface UiStrings {
  locale: string;
  menuTitle: string;
  categoriesLabel: string;
  single: string;
  menu: string;
  soldOut: string;
  grams: string;
  allergensLabel: string;
  call: string;
  openMap: string;
  hours: string;
  badges: Record<Badge, string>;
  allergens: Record<Allergen, string>;
  days: Record<Day, string>;
}

export const ui: Record<Lang, UiStrings> = {
  tr: {
    locale: 'tr-TR',
    menuTitle: 'Menü',
    categoriesLabel: 'Kategoriler',
    single: 'Tek',
    menu: 'Menü',
    soldOut: 'Tükendi',
    grams: 'gr',
    allergensLabel: 'Alerjenler',
    call: 'Ara',
    openMap: 'Haritada aç',
    hours: 'Çalışma saatleri',
    badges: {
      yeni: 'Yeni',
      acili: 'Acılı',
      vejetaryen: 'Vejetaryen',
      'sef-onerisi': 'Şefin önerisi',
    },
    allergens: {
      gluten: 'Gluten',
      laktoz: 'Laktoz',
      yumurta: 'Yumurta',
      findik: 'Fındık',
      soya: 'Soya',
    },
    days: {
      mon: 'Pzt',
      tue: 'Sal',
      wed: 'Çar',
      thu: 'Per',
      fri: 'Cum',
      sat: 'Cmt',
      sun: 'Paz',
    },
  },
  en: {
    locale: 'en-GB',
    menuTitle: 'Menu',
    categoriesLabel: 'Categories',
    single: 'Single',
    menu: 'Meal',
    soldOut: 'Sold out',
    grams: 'g',
    allergensLabel: 'Allergens',
    call: 'Call',
    openMap: 'Open in maps',
    hours: 'Opening hours',
    badges: {
      yeni: 'New',
      acili: 'Spicy',
      vejetaryen: 'Vegetarian',
      'sef-onerisi': "Chef's pick",
    },
    allergens: {
      gluten: 'Gluten',
      laktoz: 'Dairy',
      yumurta: 'Egg',
      findik: 'Nuts',
      soya: 'Soy',
    },
    days: {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun',
    },
  },
};
