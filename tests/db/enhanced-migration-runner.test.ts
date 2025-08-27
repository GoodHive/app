import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MigrationRunner } from '@/app/db/enhanced-migration-runner';
import fs from 'fs';
import path from 'path';

// Mock fs and path modules
vi.mock('fs', () => ({
  default: {
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  }
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn(),
  }
}));

// Mock postgres
const mockSql = vi.fn();
mockSql.begin = vi.fn();
mockSql.unsafe = vi.fn();
mockSql.end = vi.fn();

vi.mock('postgres', () => {
  return { default: vi.fn(() => mockSql) };
});

describe('MigrationRunner', () => {
  let migrationRunner: MigrationRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (path.join as any).mockImplementation((...args: string[]) => args.join('/'));
    (fs.readdirSync as any).mockReturnValue(['001_create_users.sql', '002_add_thirdweb_support.sql']);
    (fs.readFileSync as any).mockReturnValue(`
      CREATE TABLE test (id INT);
      INSERT INTO test VALUES (1);
      -- This is a comment
    `);

    migrationRunner = new MigrationRunner('postgresql://test:test@localhost:5432/test');
  });

  describe('constructor', () => {
    it('should initialize with database URL', () => {
      expect(migrationRunner).toBeInstanceOf(MigrationRunner);
    });
  });

  describe('init', () => {
    it('should create schema_migrations table', async () => {
      mockSql.mockResolvedValue([]);

      await migrationRunner.init();

      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('CREATE TABLE IF NOT EXISTS goodhive.schema_migrations')
        ])
      );
    });
  });

  describe('getMigrationFiles', () => {
    it('should return only .sql files in sorted order', async () => {
      (fs.readdirSync as any).mockReturnValue([
        '003_update_schema.sql',
        'README.md',
        '001_initial.sql',
        '002_add_columns.sql',
        'script.js'
      ]);

      const files = await (migrationRunner as any).getMigrationFiles();

      expect(files).toEqual([
        '001_initial.sql',
        '002_add_columns.sql',
        '003_update_schema.sql'
      ]);
    });
  });

  describe('getExecutedMigrations', () => {
    it('should return executed migrations from database', async () => {
      const mockMigrations = [
        {
          id: 1,
          filename: '001_initial.sql',
          executed_at: new Date('2023-01-01'),
          checksum: 'abc123'
        }
      ];

      mockSql.mockResolvedValue(mockMigrations);

      const result = await (migrationRunner as any).getExecutedMigrations();

      expect(result).toEqual(mockMigrations);
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('SELECT id, filename, executed_at, checksum')
        ])
      );
    });

    it('should return empty array if table does not exist', async () => {
      mockSql.mockRejectedValue(new Error('Table does not exist'));

      const result = await (migrationRunner as any).getExecutedMigrations();

      expect(result).toEqual([]);
    });
  });

  describe('executeMigration', () => {
    beforeEach(() => {
      mockSql.begin.mockImplementation(async (callback) => callback(mockSql));
      mockSql.unsafe.mockResolvedValue([]);
      mockSql.mockResolvedValue([]);
    });

    it('should execute migration statements in transaction', async () => {
      const migrationContent = `
        CREATE TABLE users (id INT);
        INSERT INTO users VALUES (1);
        -- Comment line
      `;
      (fs.readFileSync as any).mockReturnValue(migrationContent);

      await (migrationRunner as any).executeMigration('001_test.sql');

      expect(mockSql.begin).toHaveBeenCalled();
      expect(mockSql.unsafe).toHaveBeenCalledWith('CREATE TABLE users (id INT)');
      expect(mockSql.unsafe).toHaveBeenCalledWith('INSERT INTO users VALUES (1)');
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('INSERT INTO goodhive.schema_migrations')
        ])
      );
    });

    it('should filter out comments and empty statements', async () => {
      const migrationContent = `
        -- This is a comment
        CREATE TABLE test (id INT);
        
        # Another comment style
        INSERT INTO test VALUES (1);
        
      `;
      (fs.readFileSync as any).mockReturnValue(migrationContent);

      await (migrationRunner as any).executeMigration('001_test.sql');

      expect(mockSql.unsafe).toHaveBeenCalledTimes(2); // Only non-comment statements
      expect(mockSql.unsafe).toHaveBeenCalledWith('CREATE TABLE test (id INT)');
      expect(mockSql.unsafe).toHaveBeenCalledWith('INSERT INTO test VALUES (1)');
    });

    it('should record migration with checksum and execution time', async () => {
      await (migrationRunner as any).executeMigration('001_test.sql');

      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('INSERT INTO goodhive.schema_migrations (filename, checksum, execution_time_ms)')
        ])
      );
    });

    it('should throw error if migration fails', async () => {
      mockSql.unsafe.mockRejectedValue(new Error('SQL error'));

      await expect(
        (migrationRunner as any).executeMigration('001_bad.sql')
      ).rejects.toThrow('SQL error');
    });
  });

  describe('runMigrations', () => {
    beforeEach(() => {
      mockSql.mockResolvedValue([]);
      mockSql.begin.mockImplementation(async (callback) => callback(mockSql));
      mockSql.unsafe.mockResolvedValue([]);
    });

    it('should execute only pending migrations', async () => {
      const executedMigrations = [
        { filename: '001_initial.sql', executed_at: new Date(), checksum: 'abc123' }
      ];
      
      // Mock executed migrations query
      mockSql.mockResolvedValueOnce(executedMigrations); // getExecutedMigrations
      mockSql.mockResolvedValue([]); // Other queries

      (fs.readdirSync as any).mockReturnValue([
        '001_initial.sql',
        '002_new_migration.sql'
      ]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await migrationRunner.runMigrations();

      expect(consoleSpy).toHaveBeenCalledWith('📁 Found 2 migration files');
      expect(consoleSpy).toHaveBeenCalledWith('✅ 1 migrations already executed');
      expect(consoleSpy).toHaveBeenCalledWith('⏳ 1 migrations pending:');

      consoleSpy.mockRestore();
    });

    it('should report when all migrations are up to date', async () => {
      const executedMigrations = [
        { filename: '001_initial.sql', executed_at: new Date(), checksum: 'abc123' },
        { filename: '002_update.sql', executed_at: new Date(), checksum: 'def456' }
      ];
      
      mockSql.mockResolvedValue(executedMigrations);

      (fs.readdirSync as any).mockReturnValue([
        '001_initial.sql',
        '002_update.sql'
      ]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await migrationRunner.runMigrations();

      expect(consoleSpy).toHaveBeenCalledWith('🎉 All migrations are up to date!');

      consoleSpy.mockRestore();
    });
  });

  describe('status', () => {
    it('should display migration status', async () => {
      const executedMigrations = [
        { filename: '001_initial.sql', executed_at: new Date('2023-01-01'), checksum: 'abc123' }
      ];
      
      mockSql.mockResolvedValue(executedMigrations);

      (fs.readdirSync as any).mockReturnValue([
        '001_initial.sql',
        '002_pending.sql'
      ]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await migrationRunner.status();

      expect(consoleSpy).toHaveBeenCalledWith('🐝 Migration Status:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Executed - 001_initial.sql'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⏳ Pending - 002_pending.sql'));
      expect(consoleSpy).toHaveBeenCalledWith('📊 Summary: 1 executed, 1 pending');

      consoleSpy.mockRestore();
    });
  });

  describe('rollback', () => {
    it('should log rollback not implemented message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await migrationRunner.rollback('001_test.sql');

      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Rollback functionality not implemented yet');
      expect(consoleSpy).toHaveBeenCalledWith('Requested rollback for: 001_test.sql');

      consoleSpy.mockRestore();
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await migrationRunner.close();

      expect(mockSql.end).toHaveBeenCalled();
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksum for same content', () => {
      const content = 'CREATE TABLE test (id INT);';
      
      const checksum1 = (migrationRunner as any).generateChecksum(content);
      const checksum2 = (migrationRunner as any).generateChecksum(content);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toBeTruthy();
      expect(typeof checksum1).toBe('string');
    });

    it('should generate different checksums for different content', () => {
      const content1 = 'CREATE TABLE test1 (id INT);';
      const content2 = 'CREATE TABLE test2 (id INT);';
      
      const checksum1 = (migrationRunner as any).generateChecksum(content1);
      const checksum2 = (migrationRunner as any).generateChecksum(content2);
      
      expect(checksum1).not.toBe(checksum2);
    });
  });
});