import { env } from '../config/env.js';

// Опційний модуль: курс валют з API НБУ на конкретну дату.
// НБУ повертає курс гривні за 1 одиницю валюти (rate) — саме те, що нам треба як rateToBase.
// Формат дати для API: YYYYMMDD
function toNbuDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// Повертає { UAH: 1, USD: <rate>, EUR: <rate> } на дату
export async function fetchNbuRates(date) {
  if (!env.nbu.enabled) {
    throw new Error('Модуль НБУ вимкнено (NBU_ENABLED=false)');
  }

  const url = `${env.nbu.apiUrl}?date=${toNbuDate(date)}&json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`НБУ API повернув статус ${res.status}`);

  const data = await res.json();
  const result = { UAH: 1 };
  for (const item of data) {
    if (item.cc === 'USD') result.USD = item.rate;
    if (item.cc === 'EUR') result.EUR = item.rate;
  }
  return result;
}
