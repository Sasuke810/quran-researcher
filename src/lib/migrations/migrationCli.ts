#!/usr/bin/env node

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

import { createDatabaseConnection } from '../database/connection';
import { MigrationManager } from './migrationManager';
import * as path from 'path';

class MigrationCli {
  private manager: MigrationManager;

  constructor() {
    const db = createDatabaseConnection();
    this.manager = new MigrationManager(db, {
      migrationsPath: path.resolve('database/migrations')
    });
  }

  async run(): Promise<void> {
    try {
      await this.manager.initialize();
      await this.migrate();
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  }

  private async migrate(): Promise<void> {
    console.log('Running migrations...');
    const results = await this.manager.migrate();

    if (results.length === 0) {
      console.log('No pending migrations found.');
      return;
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\nMigration Summary:`);
    console.log(`✅ Successful: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
    }

    // Show details for failed migrations
    results.filter(r => !r.success).forEach(result => {
      console.log(`\n❌ ${result.migration.id} - ${result.migration.name}`);
      console.log(`   Error: ${result.error}`);
    });
  }
}

// Main execution
async function main() {
  const cli = new MigrationCli();
  await cli.run();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
