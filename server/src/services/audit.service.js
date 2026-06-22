import { prisma } from '../lib/prisma.js';

// Decimal/Date → JSON-сумісні значення
function serialize(obj) {
  if (!obj) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}

// Записує подію в журнал змін (audit log)
export async function recordAudit({ entity, entityId, action, userId, before, after }) {
  return prisma.auditLog.create({
    data: {
      entity,
      entityId,
      action,
      userId,
      before: before ? serialize(before) : undefined,
      after: after ? serialize(after) : undefined,
    },
  });
}
