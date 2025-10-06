import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { createHash } from 'crypto';
import { DatabaseConnection } from '../repositories/baseRepository';

export interface MigrationInfo {
  id: string;
  name: string;
  description?: string;
  version: string;
  executedAt?: Date;
  checksum?: string;
}

export abstract class BaseMigration {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly version: string;

  constructor(id: string, name: string, version: string, description?: string) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.description = description;
  }

  /**
   * Execute the migration
   */
  abstract up(db: DatabaseConnection): Promise<void>;

  /**
   * Rollback the migration (optional)
   */
  abstract down(db: DatabaseConnection): Promise<void>;

  /**
   * Validate that the migration can be executed
   */
  async validate(db: DatabaseConnection): Promise<boolean> {
    // Default implementation - can be overridden
    return true;
  }

  /**
   * Get migration info
   */
  getInfo(): MigrationInfo {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version
    };
  }

  /**
   * Calculate checksum for the migration content
   */
  abstract getChecksum(): string;
}

export class SqlMigration extends BaseMigration {
  private upSql: string;
  private downSql?: string;

  constructor(
    id: string,
    name: string,
    version: string,
    upSql: string,
    downSql?: string,
    description?: string
  ) {
    super(id, name, version, description);
    this.upSql = upSql;
    this.downSql = downSql;
  }

  async up(db: DatabaseConnection): Promise<void> {
    await db.query(this.upSql);
  }

  async down(db: DatabaseConnection): Promise<void> {
    if (!this.downSql) {
      throw new Error(`No down migration defined for ${this.id}`);
    }
    await db.query(this.downSql);
  }

  getChecksum(): string {
    // Simple checksum implementation - in production, use a proper hash function
    const content = this.upSql + (this.downSql || '');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

export class SqlFileMigration extends BaseMigration {
  private readonly upFilePath: string;
  private readonly downFilePath?: string;
  private checksum?: string;

  constructor(
    id: string,
    name: string,
    version: string,
    upFilePath: string,
    downFilePath?: string,
    description?: string
  ) {
    super(id, name, version, description);
    this.upFilePath = upFilePath;
    this.downFilePath = downFilePath;
  }

  async up(db: DatabaseConnection): Promise<void> {
    let sql = await fsPromises.readFile(this.upFilePath, 'utf8');
    try {
      await db.query(sql);
    } finally {
      // Help the GC release the large string buffer sooner.
      sql = '';
    }
  }

  async down(db: DatabaseConnection): Promise<void> {
    if (!this.downFilePath) {
      throw new Error(`No down migration defined for ${this.id}`);
    }

    let sql = await fsPromises.readFile(this.downFilePath, 'utf8');
    try {
      await db.query(sql);
    } finally {
      sql = '';
    }
  }

  getChecksum(): string {
    if (!this.checksum) {
      this.checksum = this.computeChecksum();
    }
    return this.checksum;
  }

  private computeChecksum(): string {
    const hash = createHash('sha256');
    updateHashWithFile(hash, this.upFilePath);

    if (this.downFilePath && fs.existsSync(this.downFilePath)) {
      updateHashWithFile(hash, this.downFilePath);
    }

    return hash.digest('hex');
  }
}

function updateHashWithFile(hash: ReturnType<typeof createHash>, filePath: string): void {
  const fd = fs.openSync(filePath, 'r');
  const bufferSize = 1024 * 1024; // 1MB chunk size keeps memory usage low
  const buffer = Buffer.allocUnsafe(bufferSize);

  try {
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(fd, buffer, 0, bufferSize, null)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }
}

export class JsMigration extends BaseMigration {
  private upFunction: (db: DatabaseConnection) => Promise<void>;
  private downFunction?: (db: DatabaseConnection) => Promise<void>;

  constructor(
    id: string,
    name: string,
    version: string,
    upFunction: (db: DatabaseConnection) => Promise<void>,
    downFunction?: (db: DatabaseConnection) => Promise<void>,
    description?: string
  ) {
    super(id, name, version, description);
    this.upFunction = upFunction;
    this.downFunction = downFunction;
  }

  async up(db: DatabaseConnection): Promise<void> {
    await this.upFunction(db);
  }

  async down(db: DatabaseConnection): Promise<void> {
    if (!this.downFunction) {
      throw new Error(`No down migration defined for ${this.id}`);
    }
    await this.downFunction(db);
  }

  getChecksum(): string {
    // For JS migrations, use function string representation
    const content = this.upFunction.toString() + (this.downFunction?.toString() || '');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}
