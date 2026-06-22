import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/password.js';
import { createUserSchema, updateUserSchema } from '../validators/schemas.js';

const select = {
  id: true, email: true, name: true, role: true, isActive: true, createdAt: true,
};

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ select, orderBy: { createdAt: 'asc' } });
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const data = createUserSchema.parse(req.body);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash: await hashPassword(data.password),
    },
    select,
  });
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = updateUserSchema.parse(req.body);
  const patch = { name: data.name, role: data.role, isActive: data.isActive };
  if (data.password) patch.passwordHash = await hashPassword(data.password);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: patch,
    select,
  });
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  // М'яке видалення — деактивація (зберігаємо зв'язки з транзакціями)
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.status(204).end();
});
