import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Одноразове очищення: прибирає всі тестові/демо-дані з робочої БД.
// Лишає власника та категорії. Запуск: `node prisma/reset-demo.js`.
async function main() {
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.exchangeRate.deleteMany({});
  await prisma.account.deleteMany({});

  // Демо-користувачі (власник лишається)
  const removed = await prisma.user.deleteMany({
    where: { email: { in: ['accountant@biz.local', 'manager@biz.local'] } },
  });

  console.log(`🧹 Очищено: транзакції, рахунки, курси, аудит; демо-користувачів видалено: ${removed.count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
