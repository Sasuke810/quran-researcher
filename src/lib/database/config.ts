import { DatabaseConfig } from '../models/types';

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'quran_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  };
}

export function getDatabaseUrl(): string {
  const config = getDatabaseConfig();
  const sslParam = config.ssl ? '?sslmode=require' : '';
  return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`;
}
