// Admin panel UI strings. The panel is Turkish-only: its single user is the
// owner. Customer-facing strings live in ui.ts.
export const admin = {
  title: 'Panel',
  login: {
    heading: 'Panel girişi',
    email: 'E-posta',
    password: 'Şifre',
    submit: 'Giriş yap',
    missing: 'E-posta ve şifre gerekli.',
    invalid: 'E-posta veya şifre hatalı.',
    notAdmin: 'Bu hesabın panel yetkisi yok.',
    unavailable: 'Giriş şu an yapılamıyor, biraz sonra tekrar deneyin.',
  },
  logout: 'Çıkış',
  signedInAs: 'Giriş yapan',
  home: {
    heading: 'Menü paneli',
  },
} as const;
