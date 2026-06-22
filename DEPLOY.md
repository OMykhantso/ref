# 🚀 Деплой на Render

Проєкт зібрано в **один web-сервіс**: Express роздає API (`/api`) та зібраний React з того самого джерела. Окремий PostgreSQL — керований Render. Усе описано в [`render.yaml`](render.yaml) (Blueprint).

## Передумови
- Акаунт на [render.com](https://render.com) (безкоштовний)
- Акаунт на GitHub (Render деплоїть із Git-репозиторію)

## Крок 1. Залити код на GitHub

Локальний git-репозиторій уже створено і код закомічено. Лишилось додати віддалений репозиторій і запушити:

```bash
cd C:\Users\sa\biz-finance

# Створіть порожній репозиторій на GitHub (через сайт), потім:
git remote add origin https://github.com/<ваш-логін>/biz-finance.git
git branch -M main
git push -u origin main
```

> Якщо встановите GitHub CLI (`winget install GitHub.cli`), можна одним рядком:
> `gh repo create biz-finance --private --source . --push`

## Крок 2. Створити сервіси в Render (Blueprint)

1. Render → **New +** → **Blueprint**.
2. Підключіть свій GitHub і виберіть репозиторій `biz-finance`.
3. Render прочитає `render.yaml` і запропонує створити:
   - **biz-finance** — web-сервіс (Docker)
   - **biz-finance-db** — PostgreSQL (free)
4. Перед «Apply» вас попросять задати змінну **`OWNER_PASSWORD`** — введіть пароль власника (мін. 6 символів).
5. Натисніть **Apply**. Render збере Docker-образ, підніме базу, виконає `prisma db push` + seed і запустить сервіс.

Решта змінних виставляються автоматично:
- `DATABASE_URL` — підключення до Postgres (з'єднується автоматично)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — генеруються Render
- `BASE_CURRENCY=UAH`, `NBU_ENABLED=true`, `OWNER_EMAIL=owner@biz.local`

## Крок 3. Готово

Після деплою застосунок доступний за адресою виду
`https://biz-finance-XXXX.onrender.com`.

**Логін:** `owner@biz.local` / `<OWNER_PASSWORD, який ви ввели>`.
Seed також створює `accountant@biz.local` / `accountant12345` та `manager@biz.local` / `manager12345` — **обов'язково змініть їхні паролі** на сторінці «Користувачі».

## Оновлення

`autoDeploy: true` — кожен `git push` у `main` автоматично передеплоює сервіс. `prisma db push` і seed виконуються щоразу при старті контейнера (ідемпотентно).

## Нюанси безкоштовного тарифу
- Web-сервіс **засинає** після ~15 хв простою; перший запит після сну займає ~30–60 с.
- Безкоштовний PostgreSQL Render діє обмежений період (нині ~30–90 днів) — для постійного використання перейдіть на платний план БД.
- Кирилиця в PDF-експорті потребує підключення TTF-шрифту (див. примітку в [README.md](README.md)).
