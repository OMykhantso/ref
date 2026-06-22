#!/bin/sh
set -e

# Синхронізуємо схему з БД (без файлів міграцій — db push)
echo "→ Prisma db push…"
npx prisma db push --skip-generate

# Одноразове очищення демо-даних: вмикається env RESET_DEMO=true,
# після відпрацювання прапорець треба прибрати в дашборді.
if [ "$RESET_DEMO" = "true" ]; then
  echo "→ RESET_DEMO=true: чищу демо-дані…"
  node prisma/reset-demo.js || echo "⚠ reset пропущено"
fi

# Початкові дані (idempotent: upsert). Не валимо старт, якщо seed спіткнувся.
echo "→ Seed…"
node prisma/seed.js || echo "⚠ seed пропущено"

echo "→ Старт сервера…"
exec node src/index.js
