export const ROLE_LABELS = {
  OWNER: 'Власник',
  ACCOUNTANT: 'Бухгалтер',
  MANAGER: 'Менеджер',
};

export const ACCOUNT_TYPE_LABELS = {
  CASH: 'Каса',
  BANK: 'Банк',
  CARD: 'Картка',
};

export const PAYMENT_LABELS = {
  CASH: 'Готівка',
  CARD: 'Картка',
  ACCOUNT: 'Рахунок',
};

export const TX_TYPE_LABELS = {
  INCOME: 'Дохід',
  EXPENSE: 'Витрата',
};

export const CURRENCIES = ['UAH', 'USD', 'EUR'];

// Матриця доступів (дублює бекенд, для UI)
const PERMISSIONS = {
  OWNER: ['*'],
  ACCOUNTANT: ['tx:create', 'tx:update', 'tx:delete', 'tx:read', 'report:read',
    'category:write', 'account:write', 'rate:write', 'dashboard:read'],
  MANAGER: ['tx:create', 'tx:read', 'report:read', 'dashboard:read', 'rate:read'],
};

export function can(role, permission) {
  const p = PERMISSIONS[role] ?? [];
  return p.includes('*') || p.includes(permission);
}
