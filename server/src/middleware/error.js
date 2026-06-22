import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Маршрут не знайдено' });
}

// Централізована обробка помилок
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Помилка валідації',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Запис із такими даними вже існує' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Запис не знайдено' });
  }

  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
}
