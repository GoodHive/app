import postgres from "postgres";
import fs from "fs";
import path from "path";

interface MigrationRecord {
  id: number;
  filename: string;
  executed_at: Date;
  checksum: string;
}

class MigrationRunner {
  private sql: any;
  private migrationsPath: string;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      ssl: {
        rejectUnauthorized: false,
      },
    });
    this.migrationsPath = path.join(__dirname, "migrations");
  }

  async init() {
    // Create migrations tracking table if it doesn't exist
    await this.sql`
      CREATE TABLE IF NOT EXISTS goodhive.schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INT,
        INDEX idx_schema_migrations_filename (filename),
        INDEX idx_schema_migrations_executed (executed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Tracks executed database migrations'
    `;
  }

  private generateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      return await this.sql`
        SELECT id, filename, executed_at, checksum 
        FROM goodhive.schema_migrations 
        ORDER BY executed_at ASC
      `;
    } catch (error) {
      // If table doesn't exist yet, return empty array
      return [];
    }
  }

  private async getMigrationFiles(): Promise<string[]> {
    const files = fs.readdirSync(this.migrationsPath);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order
  }

  private async executeMigration(filename: string): Promise<void> {
    const filepath = path.join(this.migrationsPath, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const checksum = this.generateChecksum(content);
    
    console.log(`🐝 Executing migration: ${filename}`);
    const startTime = Date.now();

    try {
      // Execute the migration in a transaction
      await this.sql.begin(async sql => {
        // Split by semicolon and execute each statement
        const statements = content
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            await sql.unsafe(statement);
          }
        }

        // Record the migration
        const executionTime = Date.now() - startTime;
        await sql`
          INSERT INTO goodhive.schema_migrations (filename, checksum, execution_time_ms)
          VALUES (${filename}, ${checksum}, ${executionTime})
        `;
      });

      console.log(`✅ Migration ${filename} completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    console.log('🐝 Starting GoodHive database migrations...');
    
    await this.init();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    const executedFilenames = new Set(executedMigrations.map(m => m.filename));
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    console.log(`✅ ${executedMigrations.length} migrations already executed`);

    const pendingMigrations = migrationFiles.filter(
      filename => !executedFilenames.has(filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('🎉 All migrations are up to date!');
      return;
    }

    console.log(`⏳ ${pendingMigrations.length} migrations pending:`);
    pendingMigrations.forEach(filename => {
      console.log(`   - ${filename}`);
    });

    // Execute pending migrations
    for (const filename of pendingMigrations) {
      await this.executeMigration(filename);
    }

    console.log('🎉 All migrations completed successfully!');
  }

  async rollback(filename?: string): Promise<void> {
    console.log('⚠️  Rollback functionality not implemented yet');
    console.log('Manual rollback may be required for complex migrations');
    
    if (filename) {
      console.log(`Requested rollback for: ${filename}`);
      // Could implement rollback logic here in the future
    }
  }

  async status(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    const executedFilenames = new Set(executedMigrations.map(m => m.filename));
    
    console.log('\n🐝 Migration Status:');
    console.log('==================');
    
    for (const filename of migrationFiles) {
      const isExecuted = executedFilenames.has(filename);
      const status = isExecuted ? '✅ Executed' : '⏳ Pending';
      const timestamp = isExecuted 
        ? executedMigrations.find(m => m.filename === filename)?.executed_at.toISOString() 
        : '';
      
      console.log(`${status} - ${filename} ${timestamp ? `(${timestamp})` : ''}`);
    }
    
    const pendingCount = migrationFiles.length - executedMigrations.length;
    console.log(`\n📊 Summary: ${executedMigrations.length} executed, ${pendingCount} pending`);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

// Main execution
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const runner = new MigrationRunner(databaseUrl);
  
  try {
    const command = process.argv[2];
    
    switch (command) {
      case 'status':
        await runner.status();
        break;
      case 'rollback':
        const filename = process.argv[3];
        await runner.rollback(filename);
        break;
      default:
        await runner.runMigrations();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MigrationRunner };