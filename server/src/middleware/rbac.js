import { forbidden } from '../utils/httpError.js';

// Матриця доступів за ролями.
// OWNER      — повний доступ
// ACCOUNTANT — транзакції (CRUD), звіти, категорії, рахунки, курси
// MANAGER    — створення транзакцій, перегляд балансів; без керування користувачами
export const PERMISSIONS = {
  OWNER: ['*'],
  ACCOUNTANT: [
    'tx:create', 'tx:update', 'tx:delete', 'tx:read',
    'report:read', 'category:write', 'account:write', 'rate:write',
    'dashboard:read', 'audit:read',
  ],
  MANAGER: [
    'tx:create', 'tx:read',
    'report:read', 'dashboard:read', 'rate:read',
  ],
};

export function can(role, permission) {
  const perms = PERMISSIONS[role] ?? [];
  return perms.includes('*') || perms.includes(permission);
}

// Middleware-фабрика: requirePermission('tx:create')
export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(forbidden());
    if (!can(req.user.role, permission)) {
      return next(forbidden(`Дія "${permission}" недоступна для ролі ${req.user.role}`));
    }
    next();
  };
}

// Тільки для перелічених ролей
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}
