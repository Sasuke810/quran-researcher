import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConnection } from '../repositories/baseRepository';
import { BaseMigration, SqlFileMigration, JsMigration } from './baseMigration';
import { MigrationRunner, MigrationResult } from './migrationRunner';

export interface MigrationManagerOptions {
  migrationsPath: string;
  migrationsTable?: string;
  filePattern?: RegExp;
}

export interface MigrationStatus {
  totalMigrations: number;
  executedMigrations: number;
  pendingMigrations: number;
  migrations: {
    id: string;
    name: string;
    version: string;
    status: 'executed' | 'pending';
    executedAt?: Date;
  }[];
}

export class MigrationManager {
  private db: DatabaseConnection;
  private runner: MigrationRunner;
  private options: MigrationManagerOptions;
  private migrations: BaseMigration[] = [];

  constructor(db: DatabaseConnection, options: MigrationManagerOptions) {
    this.db = db;
    this.options = {
      migrationsTable: 'schema_migrations',
      filePattern: /^\d{4}_.*\.(sql|js|ts)$/,
      ...options
    };
    this.runner = new MigrationRunner(db, this.options.migrationsTable);
  }

  /**
   * Initialize the migration system
   */
  async initialize(): Promise<void> {
    await this.runner.initialize();
    await this.loadMigrations();
  }

  /**
   * Load migrations from the filesystem
   */
  private async loadMigrations(): Promise<void> {
    this.migrations = [];

    if (!fs.existsSync(this.options.migrationsPath)) {
      throw new Error(`Migrations path does not exist: ${this.options.migrationsPath}`);
    }

    const files = fs.readdirSync(this.options.migrationsPath)
      .filter(file => this.options.filePattern!.test(file))
      .sort();

    for (const file of files) {
      const filePath = path.join(this.options.migrationsPath, file);
      const migration = await this.loadMigrationFromFile(filePath);
      if (migration) {
        this.migrations.push(migration);
      }
    }
  }

  /**
   * Load a single migration from a file
   */
  private async loadMigrationFromFile(filePath: string): Promise<BaseMigration | null> {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    
    // Extract ID and name from filename (e.g., "0001_initial_schema" -> id: "0001", name: "initial_schema")
    const match = nameWithoutExt.match(/^(\d{4})_(.+)$/);
    if (!match) {
      console.warn(`Skipping migration file with invalid format: ${fileName}`);
      return null;
    }

    const [, id, name] = match;
    const version = id;

    try {
      if (ext === '.sql') {
        return new SqlFileMigration(id, name, version, filePath, undefined, `SQL migration: ${name}`);
      } else if (ext === '.js' || ext === '.ts') {
        // For JS/TS files, we would need to dynamically import them
        // This is a simplified version - in practice, you might want to use a more sophisticated loader
        const module = await import(filePath);
        if (module.default && typeof module.default === 'function') {
          return module.default(id, name, version);
        } else if (module.up && typeof module.up === 'function') {
          return new JsMigration(
            id,
            name,
            version,
            module.up,
            module.down,
            module.description || `JS migration: ${name}`
          );
        }
      }
    } catch (error) {
      console.error(`Error loading migration ${fileName}:`, error);
      return null;
    }

    return null;
  }

  /**
   * Get all migrations
   */
  getMigrations(): BaseMigration[] {
    return [...this.migrations];
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<BaseMigration[]> {
    const executedMigrations = await this.runner.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));
    
    return this.migrations.filter(migration => !executedIds.has(migration.id));
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<MigrationResult[]> {
    const pendingMigrations = await this.getPendingMigrations();
    const results: MigrationResult[] = [];

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      console.log(`Executing migration: ${migration.id} - ${migration.name}`);
      const result = await this.runner.executeMigration(migration);
      results.push(result);

      if (!result.success) {
        console.error(`Migration ${migration.id} failed: ${result.error}`);
        break; // Stop on first failure
      } else {
        console.log(`Migration ${migration.id} completed in ${result.executionTimeMs}ms`);
      }
    }

    return results;
  }

  /**
   * Rollback the last migration
   */
  async rollback(): Promise<MigrationResult | null> {
    const executedMigrations = await this.runner.getExecutedMigrations();
    if (executedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return null;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migration = this.migrations.find(m => m.id === lastMigration.id);

    if (!migration) {
      throw new Error(`Migration ${lastMigration.id} not found in migration files`);
    }

    console.log(`Rolling back migration: ${migration.id} - ${migration.name}`);
    const result = await this.runner.rollbackMigration(migration);

    if (result.success) {
      console.log(`Rollback completed in ${result.executionTimeMs}ms`);
    } else {
      console.error(`Rollback failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    const executedMigrations = await this.runner.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));
    const executedMap = new Map(executedMigrations.map(m => [m.id, m]));

    const migrations = this.migrations.map(migration => {
      const executed = executedMap.get(migration.id);
      return {
        id: migration.id,
        name: migration.name,
        version: migration.version,
        status: executedIds.has(migration.id) ? 'executed' as const : 'pending' as const,
        executedAt: executed?.executed_at
      };
    });

    return {
      totalMigrations: this.migrations.length,
      executedMigrations: executedMigrations.length,
      pendingMigrations: this.migrations.length - executedMigrations.length,
      migrations
    };
  }

  /**
   * Reset all migrations (dangerous - use with caution)
   */
  async reset(): Promise<void> {
    console.warn('Resetting all migrations - this will drop all data!');
    
    // Get all executed migrations in reverse order
    const executedMigrations = await this.runner.getExecutedMigrations();
    executedMigrations.reverse();

    for (const executedMigration of executedMigrations) {
      const migration = this.migrations.find(m => m.id === executedMigration.id);
      if (migration) {
        console.log(`Rolling back migration: ${migration.id}`);
        await this.runner.rollbackMigration(migration);
      }
    }

    console.log('All migrations have been reset');
  }
}
