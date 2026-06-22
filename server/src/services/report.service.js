import { prisma } from '../lib/prisma.js';
import { normalizeDate } from './currency.service.js';

// Будує звіт за період із групуванням. Усі суми — у базовій валюті (UAH).
export async function buildReport({ from, to, groupBy = 'category', type }) {
  const where = {};
  if (from || to) where.date = {};
  if (from) where.date.gte = normalizeDate(from);
  if (to) where.date.lte = normalizeDate(to);
  if (type) where.type = type;

  const txs = await prisma.transaction.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      account: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Підсумки
  let income = 0;
  let expense = 0;
  const groups = new Map();

  const keyFns = {
    category: (t) => [t.categoryId, t.category?.name ?? '—'],
    user: (t) => [t.createdById, t.createdBy?.name ?? '—'],
    currency: (t) => [t.currency, t.currency],
    day: (t) => {
      const k = t.date.toISOString().slice(0, 10);
      return [k, k];
    },
    month: (t) => {
      const k = t.date.toISOString().slice(0, 7);
      return [k, k];
    },
  };
  const keyFn = keyFns[groupBy] ?? keyFns.category;

  for (const t of txs) {
    const base = Number(t.amountBase);
    if (t.type === 'INCOME') income += base;
    else expense += base;

    const [id, label] = keyFn(t);
    if (!groups.has(id)) groups.set(id, { key: id, label, income: 0, expense: 0, count: 0 });
    const g = groups.get(id);
    if (t.type === 'INCOME') g.income += base;
    else g.expense += base;
    g.count += 1;
  }

  const rows = [...groups.values()]
    .map((g) => ({
      ...g,
      income: Number(g.income.toFixed(2)),
      expense: Number(g.expense.toFixed(2)),
      net: Number((g.income - g.expense).toFixed(2)),
    }))
    .sort((a, b) => b.expense + b.income - (a.expense + a.income));

  return {
    baseCurrency: 'UAH',
    period: { from: from ?? null, to: to ?? null },
    groupBy,
    summary: {
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      profit: Number((income - expense).toFixed(2)),
      count: txs.length,
    },
    rows,
  };
}
