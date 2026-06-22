import { prisma } from '../lib/prisma.js';

// Нормалізує дату до 00:00 UTC (курс зберігаємо подобово)
export function normalizeDate(input) {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Повертає курс валюти до базової (UAH) на дату.
// Логіка пошуку: UAH=1 → точна дата → найближчий попередній курс → 1 (фолбек).
export async function getRateToBase(currency, date) {
  if (currency === 'UAH') return 1;

  const day = normalizeDate(date);

  const exact = await prisma.exchangeRate.findUnique({
    where: { currency_date: { currency, date: day } },
  });
  if (exact) return Number(exact.rate);

  const previous = await prisma.exchangeRate.findFirst({
    where: { currency, date: { lte: day } },
    orderBy: { date: 'desc' },
  });
  if (previous) return Number(previous.rate);

  return 1; // фолбек, якщо курсу ще немає
}

// Сума у валюті → сума в UAH
export function toBase(amount, rateToBase) {
  return Number((Number(amount) * Number(rateToBase)).toFixed(2));
}

// Створює/оновлює курс на дату (ручне введення або імпорт з НБУ)
export async function upsertRate({ currency, date, rate, source = 'MANUAL' }) {
  const day = normalizeDate(date);
  return prisma.exchangeRate.upsert({
    where: { currency_date: { currency, date: day } },
    update: { rate, source },
    create: { currency, date: day, rate, source },
  });
}
