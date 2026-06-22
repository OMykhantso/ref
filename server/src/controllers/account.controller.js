import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { accountSchema } from '../validators/schemas.js';
import { getRateToBase, toBase } from '../services/currency.service.js';

// Поточний залишок рахунку у власній валюті = opening + доходи − витрати
async function computeBalance(account) {
  const agg = await prisma.transaction.groupBy({
    by: ['type'],
    where: { accountId: account.id },
    _sum: { amount: true },
  });
  let balance = Number(account.opening);
  for (const row of agg) {
    const sum = Number(row._sum.amount ?? 0);
    balance += row.type === 'INCOME' ? sum : -sum;
  }
  return Number(balance.toFixed(2));
}

export const listAccounts = asyncHandler(async (_req, res) => {
  const accounts = await prisma.account.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: 'asc' },
  });

  const today = new Date();
  const enriched = await Promise.all(
    accounts.map(async (a) => {
      const balance = await computeBalance(a);
      const rate = await getRateToBase(a.currency, today);
      return { ...a, opening: Number(a.opening), balance, balanceBase: toBase(balance, rate) };
    })
  );
  res.json(enriched);
});

export const createAccount = asyncHandler(async (req, res) => {
  const data = accountSchema.parse(req.body);
  const account = await prisma.account.create({ data });
  res.status(201).json(account);
});

export const updateAccount = asyncHandler(async (req, res) => {
  const data = accountSchema.partial().parse(req.body);
  const account = await prisma.account.update({ where: { id: req.params.id }, data });
  res.json(account);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await prisma.account.update({
    where: { id: req.params.id },
    data: { isArchived: true },
  });
  res.status(204).end();
});
