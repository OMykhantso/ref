import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const hash = (p) => bcrypt.hash(p, 10);

  // --- 3 користувачі ---
  const users = [
    {
      email: process.env.OWNER_EMAIL ?? 'owner@biz.local',
      name: 'Власник',
      role: 'OWNER',
      password: process.env.OWNER_PASSWORD ?? 'owner12345',
    },
    { email: 'accountant@biz.local', name: 'Бухгалтер', role: 'ACCOUNTANT', password: 'accountant12345' },
    { email: 'manager@biz.local', name: 'Менеджер', role: 'MANAGER', password: 'manager12345' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email, name: u.name, role: u.role,
        passwordHash: await hash(u.password),
      },
    });
  }

  // --- Рахунки/гаманці ---
  const accounts = [
    { name: 'Каса (готівка)', type: 'CASH', currency: 'UAH', opening: 5000 },
    { name: 'Банк UAH', type: 'BANK', currency: 'UAH', opening: 20000 },
    { name: 'Картка USD', type: 'CARD', currency: 'USD', opening: 500 },
    { name: 'Рахунок EUR', type: 'BANK', currency: 'EUR', opening: 300 },
  ];
  for (const a of accounts) {
    const exists = await prisma.account.findFirst({ where: { name: a.name } });
    if (!exists) await prisma.account.create({ data: a });
  }

  // --- Категорії ---
  const categories = [
    { name: 'Продажі', type: 'INCOME', color: '#22c55e' },
    { name: 'Інші доходи', type: 'INCOME', color: '#14b8a6' },
    { name: 'Закупка', type: 'EXPENSE', color: '#ef4444' },
    { name: 'Зарплата', type: 'EXPENSE', color: '#f97316' },
    { name: 'Оренда', type: 'EXPENSE', color: '#a855f7' },
    { name: 'Реклама', type: 'EXPENSE', color: '#3b82f6' },
    { name: 'Податки', type: 'EXPENSE', color: '#64748b' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { name_type: { name: c.name, type: c.type } },
      update: {},
      create: c,
    });
  }

  // --- Курси на сьогодні (приклад, ручні) ---
  const today = new Date();
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const rates = [
    { currency: 'USD', rate: 41.5 },
    { currency: 'EUR', rate: 45.0 },
  ];
  for (const r of rates) {
    await prisma.exchangeRate.upsert({
      where: { currency_date: { currency: r.currency, date: day } },
      update: { rate: r.rate },
      create: { currency: r.currency, date: day, rate: r.rate, source: 'MANUAL' },
    });
  }

  console.log('✅ Seed завершено. Логіни:');
  console.log('   owner@biz.local / owner12345 (Власник)');
  console.log('   accountant@biz.local / accountant12345 (Бухгалтер)');
  console.log('   manager@biz.local / manager12345 (Менеджер)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
