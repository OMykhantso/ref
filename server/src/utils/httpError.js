// Проста HTTP-помилка з кодом статусу
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, d) => new HttpError(400, msg, d);
export const unauthorized = (msg = 'Не авторизовано') => new HttpError(401, msg);
export const forbidden = (msg = 'Недостатньо прав') => new HttpError(403, msg);
export const notFound = (msg = 'Не знайдено') => new HttpError(404, msg);
export const conflict = (msg = 'Конфлікт даних') => new HttpError(409, msg);
