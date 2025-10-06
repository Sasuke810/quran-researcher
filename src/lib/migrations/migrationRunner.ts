import { DatabaseConnection } from '../repositories/baseRepository';
import { BaseMigration, MigrationInfo } from './baseMigration';

export interface MigrationRecord {
  id: string;
  name: string;
  version: string;
  checksum: string;
  executed_at: Date;
  execution_time_ms: number;
}

export interface MigrationResult {
  success: boolean;
  migration: MigrationInfo;
  executionTimeMs: number;
  error?: string;
}

export class MigrationRunner {
  private db: DatabaseConnection;
  private migrationsTable: string;

  constructor(db: DatabaseConnection, migrationsTable: string = 'schema_migrations') {
    this.db = db;
    this.migrationsTable = migrationsTable;
  }

  /**
   * Initialize the migrations table
   */
  async initialize(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        checksum VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_${this.migrationsTable}_version 
      ON ${this.migrationsTable} (version);
      
      CREATE INDEX IF NOT EXISTS idx_${this.migrationsTable}_executed_at 
      ON ${this.migrationsTable} (executed_at);
    `;

    await this.db.query(createTableSql);
  }

  /**
   * Check if a migration has been executed
   */
  async isMigrationExecuted(migrationId: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT id FROM ${this.migrationsTable} WHERE id = $1`,
      [migrationId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get all executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.db.query(
      `SELECT * FROM ${this.migrationsTable} ORDER BY executed_at ASC`
    );
    return result.rows;
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: BaseMigration): Promise<MigrationResult> {
    const startTime = Date.now();
    const migrationInfo = migration.getInfo();

    try {
      // Check if migration is already executed
      if (await this.isMigrationExecuted(migration.id)) {
        return {
          success: false,
          migration: migrationInfo,
          executionTimeMs: 0,
          error: `Migration ${migration.id} has already been executed`
        };
      }

      // Validate migration
      const isValid = await migration.validate(this.db);
      if (!isValid) {
        return {
          success: false,
          migration: migrationInfo,
          executionTimeMs: 0,
          error: `Migration ${migration.id} validation failed`
        };
      }

      // Execute migration in a transaction
      await this.db.transaction(async (transactionDb) => {
        // Execute the migration
        await migration.up(transactionDb);

        // Record the migration
        const executionTime = Date.now() - startTime;
        await transactionDb.query(
          `INSERT INTO ${this.migrationsTable} (id, name, version, checksum, execution_time_ms)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             version = EXCLUDED.version,
             checksum = EXCLUDED.checksum,
             execution_time_ms = EXCLUDED.execution_time_ms`,
          [
            migration.id,
            migration.name,
            migration.version,
            migration.getChecksum(),
            executionTime
          ]
        );
      });

      const executionTime = Date.now() - startTime;
      return {
        success: true,
        migration: migrationInfo,
        executionTimeMs: executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        migration: migrationInfo,
        executionTimeMs: executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: BaseMigration): Promise<MigrationResult> {
    const startTime = Date.now();
    const migrationInfo = migration.getInfo();

    try {
      // Check if migration is executed
      if (!(await this.isMigrationExecuted(migration.id))) {
        return {
          success: false,
          migration: migrationInfo,
          executionTimeMs: 0,
          error: `Migration ${migration.id} has not been executed`
        };
      }

      // Execute rollback in a transaction
      await this.db.transaction(async (transactionDb) => {
        // Execute the rollback
        await migration.down(transactionDb);

        // Remove the migration record
        await transactionDb.query(
          `DELETE FROM ${this.migrationsTable} WHERE id = $1`,
          [migration.id]
        );
      });

      const executionTime = Date.now() - startTime;
      return {
        success: true,
        migration: migrationInfo,
        executionTimeMs: executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        migration: migrationInfo,
        executionTimeMs: executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    totalMigrations: number;
    executedMigrations: number;
    pendingMigrations: number;
    lastExecuted?: MigrationRecord;
  }> {
    const executed = await this.getExecutedMigrations();
    const lastExecuted = executed.length > 0 ? executed[executed.length - 1] : undefined;

    return {
      totalMigrations: 0, // This would be set by MigrationManager
      executedMigrations: executed.length,
      pendingMigrations: 0, // This would be calculated by MigrationManager
      lastExecuted
    };
  }
}
