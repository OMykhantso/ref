#!/bin/sh
set -e

# Синхронізуємо схему з БД (без файлів міграцій — db push)
echo "→ Prisma db push…"
npx prisma db push --skip-generate

# Початкові дані (idempotent: upsert). Не валимо старт, якщо seed спіткнувся.
echo "→ Seed…"
node prisma/seed.js || echo "⚠ seed пропущено"

echo "→ Старт сервера…"
exec node src/index.js
