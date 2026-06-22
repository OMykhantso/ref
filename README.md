# 💼 Фінанси малого бізнесу

Веб-додаток для обліку фінансів малого бізнесу на 3 користувачів: **доходи/витрати, мультивалютність, рахунки, дашборд, звіти з експортом у PDF/Excel, ролі та аудит-лог**.

## Стек

| Шар | Технології |
|---|---|
| Фронтенд | React 18 + Vite + Tailwind CSS + recharts |
| Бекенд | Node.js + Express |
| БД | PostgreSQL + Prisma ORM |
| Авторизація | JWT (access + refresh) + bcrypt |
| Експорт | ExcelJS (Excel) + PDFKit (PDF) |
| Курси | Ручне введення + опційний модуль НБУ |

## Ролі та доступи

| Роль | Права |
|---|---|
| **Власник** (OWNER) | повний доступ + керування користувачами |
| **Бухгалтер** (ACCOUNTANT) | CRUD транзакцій, категорії, рахунки, курси, звіти |
| **Менеджер** (MANAGER) | створення транзакцій, перегляд **своїх** транзакцій + загальний баланс, звіти |

Кожна транзакція фіксує, **хто вніс і коли**; редагування/видалення пишуться в **audit log**.

## Передумови

- Node.js 18+ (потрібен глобальний `fetch` для модуля НБУ)
- PostgreSQL 16 (локально або через Docker)

---

## Запуск локально

### 1. База даних

Через Docker (найпростіше):

```bash
docker compose up -d
```

Або вкажіть власний `DATABASE_URL` у `server/.env`.

### 2. Бекенд

```bash
cd server
cp .env.example .env          # за потреби відредагуйте секрети/URL
npm install
npm run prisma:generate
npm run prisma:migrate        # створює таблиці (назва міграції, напр. init)
npm run seed                  # 3 користувачі, рахунки, категорії, курси
npm run dev                   # http://localhost:4000
```

**Тестові акаунти після seed:**

| Роль | Email | Пароль |
|---|---|---|
| Власник | `owner@biz.local` | `owner12345` |
| Бухгалтер | `accountant@biz.local` | `accountant12345` |
| Менеджер | `manager@biz.local` | `manager12345` |

### 3. Фронтенд

```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

Vite проксіює `/api` → `http://localhost:4000`, тож CORS «з коробки» не заважає.

---

## Структура

```
biz-finance/
├─ docker-compose.yml      # PostgreSQL
├─ server/                 # Express API
│  ├─ prisma/              # schema.prisma + seed.js
│  └─ src/
│     ├─ controllers/      # auth, users, accounts, categories,
│     │                    # transactions, rates, dashboard, reports
│     ├─ services/         # currency, nbu, audit, report, export
│     ├─ middleware/       # auth (JWT), rbac (ролі), error
│     ├─ validators/       # zod-схеми
│     ├─ routes/           # маршрути API
│     └─ utils/            # jwt, password, helpers
└─ client/                 # React SPA
   └─ src/
      ├─ context/          # AuthContext, ThemeContext (темна/світла)
      ├─ components/        # ui/, layout/, charts/
      ├─ pages/            # Login, Dashboard, Transactions, Accounts,
      │                    # Categories, Rates, Reports, Users
      └─ lib/api.js        # axios + автооновлення токена
```

## Логіка мультивалютності

- Базова валюта — **UAH**.
- Кожна транзакція зберігає `rateToBase` (курс до UAH на дату) та обчислений `amountBase`.
- Курс підставляється автоматично (найближчий ≤ дати) або вводиться вручну в транзакції.
- Звіти й дашборд агрегують `amountBase`, тож історичний перерахунок фіксується назавжди.

## Модуль НБУ (опційний)

- Вмикається `NBU_ENABLED=true` у `server/.env`.
- На сторінці «Курси валют» → «Підтягнути курс НБУ» зберігає USD/EUR на обрану дату.
- Якщо вимкнено — працює лише ручне введення.

## API (стисло)

```
POST   /api/auth/login            вхід → { user, accessToken, refreshToken }
POST   /api/auth/refresh          оновлення токена
GET    /api/dashboard             зведення для дашборду
GET    /api/transactions          список (фільтри, пагінація)
POST   /api/transactions          створити
PATCH  /api/transactions/:id      редагувати (OWNER/ACCOUNTANT)
DELETE /api/transactions/:id      видалити (OWNER/ACCOUNTANT)
GET    /api/transactions/:id/history   історія змін
GET    /api/accounts | categories | rates | users
GET    /api/reports               звіт за період/групуванням
GET    /api/reports/export/excel  експорт Excel
GET    /api/reports/export/pdf    експорт PDF
```

## Примітки

- **Кирилиця в PDF:** PDFKit за замовчуванням використовує Helvetica без повної підтримки кирилиці. Для коректного PDF підключіть TTF-шрифт (напр. DejaVuSans/Roboto) у `server/src/services/export.service.js` через `doc.font('шлях/до/шрифту.ttf')`. Excel-експорт кирилицю підтримує одразу.
- Видалення користувачів і рахунків — **м'яке** (деактивація/архівація), щоб зберегти зв'язки з історичними транзакціями.
