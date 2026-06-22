import { z } from 'zod';

export const currencyEnum = z.enum(['UAH', 'USD', 'EUR']);
export const txTypeEnum = z.enum(['INCOME', 'EXPENSE']);
export const accountTypeEnum = z.enum(['CASH', 'BANK', 'CARD']);
export const paymentEnum = z.enum(['CASH', 'CARD', 'ACCOUNT']);
export const roleEnum = z.enum(['OWNER', 'ACCOUNTANT', 'MANAGER']);

export const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(6, 'Мінімум 6 символів'),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1),
  type: accountTypeEnum,
  currency: currencyEnum,
  opening: z.coerce.number().default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  type: txTypeEnum,
  color: z.string().optional(),
});

export const transactionSchema = z.object({
  type: txTypeEnum,
  amount: z.coerce.number().positive('Сума має бути більшою за 0'),
  currency: currencyEnum,
  date: z.coerce.date(),
  description: z.string().optional(),
  paymentMethod: paymentEnum,
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  // необов'язково: ручний курс на цю транзакцію
  rateToBase: z.coerce.number().positive().optional(),
});

export const rateSchema = z.object({
  currency: currencyEnum,
  date: z.coerce.date(),
  rate: z.coerce.number().positive(),
});

export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['category', 'user', 'currency', 'day', 'month']).default('category'),
  type: txTypeEnum.optional(),
});
