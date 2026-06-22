import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rateSchema } from '../validators/schemas.js';
import { upsertRate, normalizeDate } from '../services/currency.service.js';
import { fetchNbuRates } from '../services/nbu.service.js';
import { env } from '../config/env.js';
import { badRequest } from '../utils/httpError.js';

export const listRates = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.currency) where.currency = req.query.currency;
  const rates = await prisma.exchangeRate.findMany({
    where, orderBy: [{ date: 'desc' }, { currency: 'asc' }], take: 200,
  });
  res.json(rates.map((r) => ({ ...r, rate: Number(r.rate) })));
});

export const setRate = asyncHandler(async (req, res) => {
  const data = rateSchema.parse(req.body);
  const rate = await upsertRate({ ...data, source: 'MANUAL' });
  res.status(201).json({ ...rate, rate: Number(rate.rate) });
});

// Опційний модуль: підтягнути курс НБУ на дату й зберегти
export const importNbu = asyncHandler(async (req, res) => {
  if (!env.nbu.enabled) throw badRequest('Модуль НБУ вимкнено');
  const date = normalizeDate(req.body.date ?? new Date());

  const rates = await fetchNbuRates(date);
  const saved = [];
  for (const currency of ['USD', 'EUR']) {
    if (rates[currency]) {
      const r = await upsertRate({ currency, date, rate: rates[currency], source: 'NBU' });
      saved.push({ ...r, rate: Number(r.rate) });
    }
  }
  res.json({ date, saved });
});

export const nbuStatus = asyncHandler(async (_req, res) => {
  res.json({ enabled: env.nbu.enabled });
});
