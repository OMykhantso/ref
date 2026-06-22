import { verifyAccessToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/httpError.js';

// Перевіряє Bearer-токен і кладе користувача у req.user
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Відсутній токен доступу'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    next(unauthorized('Недійсний або прострочений токен'));
  }
}
