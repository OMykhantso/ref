import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { unauthorized } from '../utils/httpError.js';
import { loginSchema } from '../validators/schemas.js';

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

function issueTokens(user) {
  const payload = { sub: user.id, role: user.role, name: user.name };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw unauthorized('Невірні дані для входу');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized('Невірні дані для входу');

  res.json({ user: publicUser(user), ...issueTokens(user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw unauthorized('Відсутній refresh-токен');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Недійсний refresh-токен');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw unauthorized();

  res.json({ user: publicUser(user), ...issueTokens(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw unauthorized();
  res.json({ user: publicUser(user) });
});
