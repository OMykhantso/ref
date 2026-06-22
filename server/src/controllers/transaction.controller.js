import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { transactionSchema } from '../validators/schemas.js';
import { getRateToBase, toBase, normalizeDate } from '../services/currency.service.js';
import { recordAudit } from '../services/audit.service.js';
import { forbidden, notFound } from '../utils/httpError.js';

const include = {
  account: { select: { id: true, name: true, currency: true } },
  category: { select: { id: true, name: true, type: true, color: true } },
  createdBy: { select: { id: true, name: true, role: true } },
};

function serialize(t) {
  return {
    ...t,
    amount: Number(t.amount),
    rateToBase: Number(t.rateToBase),
    amountBase: Number(t.amountBase),
  };
}

// MANAGER бачить лише свої транзакції (+ загальний баланс рахується окремо).
function scopeFor(user) {
  return user.role === 'MANAGER' ? { createdById: user.id } : {};
}

export const listTransactions = asyncHandler(async (req, res) => {
  const { from, to, type, accountId, categoryId, createdById } = req.query;
  const where = { ...scopeFor(req.user) };

  if (from || to) where.date = {};
  if (from) where.date.gte = normalizeDate(from);
  if (to) where.date.lte = normalizeDate(to);
  if (type) where.type = type;
  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (createdById && req.user.role !== 'MANAGER') where.createdById = createdById;

  const page = Math.max(1, Number(req.query.page ?? 1));
  const take = Math.min(100, Number(req.query.pageSize ?? 25));

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where, include, orderBy: { date: 'desc' },
      skip: (page - 1) * take, take,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ items: items.map(serialize), total, page, pageSize: take });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const data = transactionSchema.parse(req.body);

  const rateToBase = data.rateToBase ?? (await getRateToBase(data.currency, data.date));
  const amountBase = toBase(data.amount, rateToBase);

  const tx = await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      rateToBase,
      amountBase,
      date: normalizeDate(data.date),
      description: data.description,
      paymentMethod: data.paymentMethod,
      accountId: data.accountId,
      categoryId: data.categoryId,
      createdById: req.user.id,
    },
    include,
  });

  await recordAudit({
    entity: 'Transaction', entityId: tx.id, action: 'CREATE',
    userId: req.user.id, after: serialize(tx),
  });

  res.status(201).json(serialize(tx));
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const existing = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Транзакцію не знайдено');

  // MANAGER не редагує транзакції (немає права tx:update — перехоплено в роуті),
  // але навіть власні редагувати не може.
  if (req.user.role === 'MANAGER') throw forbidden();

  const data = transactionSchema.partial().parse(req.body);
  const currency = data.currency ?? existing.currency;
  const amount = data.amount ?? Number(existing.amount);
  const date = data.date ? normalizeDate(data.date) : existing.date;

  const rateToBase =
    data.rateToBase ??
    (data.currency || data.date ? await getRateToBase(currency, date) : Number(existing.rateToBase));

  const updated = await prisma.transaction.update({
    where: { id: req.params.id },
    data: {
      ...data,
      date,
      rateToBase,
      amountBase: toBase(amount, rateToBase),
    },
    include,
  });

  await recordAudit({
    entity: 'Transaction', entityId: updated.id, action: 'UPDATE',
    userId: req.user.id, before: serialize(existing), after: serialize(updated),
  });

  res.json(serialize(updated));
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const existing = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Транзакцію не знайдено');

  await prisma.transaction.delete({ where: { id: req.params.id } });

  await recordAudit({
    entity: 'Transaction', entityId: existing.id, action: 'DELETE',
    userId: req.user.id, before: serialize(existing),
  });

  res.status(204).end();
});

// Історія змін конкретної транзакції
export const transactionHistory = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { entity: 'Transaction', entityId: req.params.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});
