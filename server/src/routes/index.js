import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../middleware/rbac.js';

import * as auth from '../controllers/auth.controller.js';
import * as users from '../controllers/user.controller.js';
import * as accounts from '../controllers/account.controller.js';
import * as categories from '../controllers/category.controller.js';
import * as tx from '../controllers/transaction.controller.js';
import * as rates from '../controllers/rate.controller.js';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as reports from '../controllers/report.controller.js';

const router = Router();

// --- Auth (публічні) ---
router.post('/auth/login', auth.login);
router.post('/auth/refresh', auth.refresh);
router.get('/auth/me', authenticate, auth.me);

// Далі все потребує автентифікації
router.use(authenticate);

// --- Users (лише OWNER) ---
router.get('/users', requireRole('OWNER'), users.listUsers);
router.post('/users', requireRole('OWNER'), users.createUser);
router.patch('/users/:id', requireRole('OWNER'), users.updateUser);
router.delete('/users/:id', requireRole('OWNER'), users.deleteUser);

// --- Accounts ---
router.get('/accounts', accounts.listAccounts);
router.post('/accounts', requirePermission('account:write'), accounts.createAccount);
router.patch('/accounts/:id', requirePermission('account:write'), accounts.updateAccount);
router.delete('/accounts/:id', requirePermission('account:write'), accounts.deleteAccount);

// --- Categories ---
router.get('/categories', categories.listCategories);
router.post('/categories', requirePermission('category:write'), categories.createCategory);
router.patch('/categories/:id', requirePermission('category:write'), categories.updateCategory);
router.delete('/categories/:id', requirePermission('category:write'), categories.deleteCategory);

// --- Transactions ---
router.get('/transactions', requirePermission('tx:read'), tx.listTransactions);
router.post('/transactions', requirePermission('tx:create'), tx.createTransaction);
router.patch('/transactions/:id', requirePermission('tx:update'), tx.updateTransaction);
router.delete('/transactions/:id', requirePermission('tx:delete'), tx.deleteTransaction);
router.get('/transactions/:id/history', requirePermission('tx:read'), tx.transactionHistory);

// --- Exchange rates ---
router.get('/rates', requirePermission('rate:read'), rates.listRates);
router.get('/rates/nbu/status', rates.nbuStatus);
router.post('/rates', requirePermission('rate:write'), rates.setRate);
router.post('/rates/nbu/import', requirePermission('rate:write'), rates.importNbu);

// --- Dashboard ---
router.get('/dashboard', requirePermission('dashboard:read'), dashboard.getDashboard);

// --- Reports ---
router.get('/reports', requirePermission('report:read'), reports.getReport);
router.get('/reports/export/excel', requirePermission('report:read'), reports.exportExcel);
router.get('/reports/export/pdf', requirePermission('report:read'), reports.exportPdf);

export default router;
