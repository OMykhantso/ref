import 'dotenv/config';

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  baseCurrency: process.env.BASE_CURRENCY ?? 'UAH',

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },

  nbu: {
    enabled: (process.env.NBU_ENABLED ?? 'true') === 'true',
    apiUrl:
      process.env.NBU_API_URL ??
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange',
  },
};
