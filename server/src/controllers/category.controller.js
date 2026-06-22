import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { categorySchema } from '../validators/schemas.js';

export const listCategories = asyncHandler(async (req, res) => {
  const where = { isArchived: false };
  if (req.query.type) where.type = req.query.type;
  const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await prisma.category.update({
    where: { id: req.params.id },
    data: { isArchived: true },
  });
  res.status(204).end();
});
