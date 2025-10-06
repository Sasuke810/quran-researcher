import { Pool, PoolConfig } from 'pg';
import { DatabaseConnection } from '../repositories/baseRepository';
import { getDatabaseUrl } from './config';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgresConnection implements DatabaseConnection {
  private pool: Pool;

  constructor(config?: DatabaseConfig) {
    if (config) {
      const poolConfig: PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: config.max || 20,
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      };
      this.pool = new Pool(poolConfig);
    } else {
      // Use connection string from config
      this.pool = new Pool({
        connectionString: getDatabaseUrl(),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });
    }

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error('Query error', { text: text.substring(0, 100), duration, error });
      throw error;
    }
  }

  async transaction<T>(callback: (client: DatabaseConnection) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create a transaction-scoped connection wrapper
      const transactionConnection: DatabaseConnection = {
        query: async (text: string, params?: any[]) => {
          return client.query(text, params);
        },
        transaction: async <U>(nestedCallback: (client: DatabaseConnection) => Promise<U>) => {
          // For nested transactions, we'll use savepoints
          const savepointName = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await client.query(`SAVEPOINT ${savepointName}`);

          try {
            const result = await nestedCallback(transactionConnection);
            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
            return result;
          } catch (error) {
            await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            throw error;
          }
        }
      };

      const result = await callback(transactionConnection);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test');
      return result.rows[0].test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}

// Singleton instance
let dbConnection: PostgresConnection | null = null;

export function getDbConnection(): PostgresConnection {
  if (!dbConnection) {
    dbConnection = new PostgresConnection();
  }
  return dbConnection;
}

export function createDatabaseConnection(config?: Partial<DatabaseConfig>): PostgresConnection {
  const defaultConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    database: process.env.DB_NAME || 'quran',
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'secret',
    ssl: process.env.DB_SSL === 'true',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  };
  const finalConfig = { ...defaultConfig, ...config };
  return new PostgresConnection(finalConfig);
}
