export interface AppEnv {
  port: number;
  databaseUrl: string;
}

export function validateEnv(env: Record<string, unknown>): AppEnv {
  const rawPort = env.PORT;
  const port =
    rawPort === undefined || rawPort === ''
      ? 3000
      : typeof rawPort === 'number'
        ? rawPort
        : Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT должен быть целым числом от 1 до 65535');
  }
  if (typeof env.DATABASE_URL !== 'string' || env.DATABASE_URL === '') {
    throw new Error('DATABASE_URL обязателен');
  }

  return { port, databaseUrl: env.DATABASE_URL };
}
