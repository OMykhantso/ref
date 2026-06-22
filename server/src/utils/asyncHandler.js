// Обгортка для async-контролерів, щоб не дублювати try/catch
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
