const CURRENCY_LOCALE = 'uk-UA';

export function formatMoney(amount, currency = 'UAH') {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount ?? 0));
}

export function formatNumber(n) {
  return new Intl.NumberFormat(CURRENCY_LOCALE, { minimumFractionDigits: 2 }).format(Number(n ?? 0));
}

export function formatDate(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, { dateStyle: 'medium' }).format(new Date(d));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
