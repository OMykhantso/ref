import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRateToBase, toBase } from '../services/currency.service.js';

function monthRange(d = new Date()) {
  const from = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const to = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
  return { from, to };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const isManager = req.user.role === 'MANAGER';
  const scope = isManager ? { createdById: req.user.id } : {};
  const { from, to } = monthRange();

  // 1) Баланси по рахунках (загальні — для всіх ролей)
  const accounts = await prisma.account.findMany({ where: { isArchived: false } });
  const today = new Date();
  const accountBalances = await Promise.all(
    accounts.map(async (a) => {
      const agg = await prisma.transaction.groupBy({
        by: ['type'], where: { accountId: a.id }, _sum: { amount: true },
      });
      let balance = Number(a.opening);
      for (const row of agg) {
        const s = Number(row._sum.amount ?? 0);
        balance += row.type === 'INCOME' ? s : -s;
      }
      const rate = await getRateToBase(a.currency, today);
      return {
        id: a.id, name: a.name, type: a.type, currency: a.currency,
        balance: Number(balance.toFixed(2)), balanceBase: toBase(balance, rate),
      };
    })
  );
  const totalBalanceBase = accountBalances.reduce((s, a) => s + a.balanceBase, 0);

  // 2) Доходи/витрати за поточний місяць (у UAH)
  const monthAgg = await prisma.transaction.groupBy({
    by: ['type'],
    where: { ...scope, date: { gte: from, lte: to } },
    _sum: { amountBase: true },
  });
  const monthIncome = Number(monthAgg.find((r) => r.type === 'INCOME')?._sum.amountBase ?? 0);
  const monthExpense = Number(monthAgg.find((r) => r.type === 'EXPENSE')?._sum.amountBase ?? 0);

  // 3) Графік: доходи vs витрати за 6 місяців
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const r = monthRange(d);
    const agg = await prisma.transaction.groupBy({
      by: ['type'],
      where: { ...scope, date: { gte: r.from, lte: r.to } },
      _sum: { amountBase: true },
    });
    months.push({
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      income: Number(agg.find((x) => x.type === 'INCOME')?._sum.amountBase ?? 0),
      expense: Number(agg.find((x) => x.type === 'EXPENSE')?._sum.amountBase ?? 0),
    });
  }

  // 4) Топ категорій витрат (поточний місяць)
  const topCatRaw = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { ...scope, type: 'EXPENSE', date: { gte: from, lte: to } },
    _sum: { amountBase: true },
    orderBy: { _sum: { amountBase: 'desc' } },
    take: 5,
  });
  const catMap = Object.fromEntries(
    (await prisma.category.findMany({
      where: { id: { in: topCatRaw.map((c) => c.categoryId) } },
    })).map((c) => [c.id, c])
  );
  const topCategories = topCatRaw.map((c) => ({
    categoryId: c.categoryId,
    name: catMap[c.categoryId]?.name ?? '—',
    color: catMap[c.categoryId]?.color ?? '#64748b',
    total: Number(c._sum.amountBase ?? 0),
  }));

  // 5) Останні транзакції
  const recent = await prisma.transaction.findMany({
    where: scope,
    include: {
      account: { select: { name: true, currency: true } },
      category: { select: { name: true, color: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: 8,
  });

  res.json({
    baseCurrency: 'UAH',
    totalBalanceBase: Number(totalBalanceBase.toFixed(2)),
    accountBalances,
    month: {
      income: monthIncome,
      expense: monthExpense,
      profit: Number((monthIncome - monthExpense).toFixed(2)),
    },
    chart: months,
    topCategories,
    recent: recent.map((t) => ({
      id: t.id, type: t.type, amount: Number(t.amount), currency: t.currency,
      amountBase: Number(t.amountBase), date: t.date,
      category: t.category, account: t.account, createdBy: t.createdBy,
      description: t.description,
    })),
  });
});
