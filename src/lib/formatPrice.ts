import { ui, type Lang } from '../i18n/ui';

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    // Burger prices carry no fractional part: "260 ₺", never "260,00 ₺".
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Formats an amount (TL units, not kuruş) as "260 ₺".
 * The locale decides digit grouping; the currency symbol always trails the
 * number, matching the printed menu. All price rendering goes through here.
 */
export function formatPrice(amount: number, lang: Lang, currency = 'TRY'): string {
  const parts = formatterFor(ui[lang].locale, currency).formatToParts(amount);
  const symbol = parts.find((p) => p.type === 'currency')?.value ?? currency;
  const number = parts
    .filter((p) => p.type !== 'currency' && p.type !== 'literal')
    .map((p) => p.value)
    .join('');
  return `${number} ${symbol}`;
}
