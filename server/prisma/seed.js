import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

// Робочий seed: створює лише власника (з env OWNER_PASSWORD) та базові категорії.
// Рахунки, курси й інших користувачів додає вже сам власник у застосунку.
async function main() {
  const hash = (p) => bcrypt.hash(p, 10);

  // --- Власник ---
  const ownerEmail = process.env.OWNER_EMAIL ?? 'owner@biz.local';
  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: 'Власник',
      role: 'OWNER',
      passwordHash: await hash(process.env.OWNER_PASSWORD ?? 'owner12345'),
    },
  });

  // --- Базові категорії (редагуються в застосунку) ---
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

  console.log(`✅ Seed: власник ${ownerEmail} + базові категорії готові`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
