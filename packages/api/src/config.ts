function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  auth0: {
    domain:   requireEnv('AUTH0_DOMAIN'),
    audience: requireEnv('AUTH0_AUDIENCE'),
  },
  database: {
    url: requireEnv('DATABASE_URL'),
  },
  port: parseInt(process.env['PORT'] ?? '3001', 10),
};
