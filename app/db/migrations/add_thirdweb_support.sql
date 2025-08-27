-- ========================================
-- THIRDWEB MIGRATION SCRIPT
-- Adds support for Thirdweb wallets and migration tracking
-- Created: December 2024
-- ========================================

-- Step 1: Add Thirdweb columns to existing users table (non-breaking changes)
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS thirdweb_wallet_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS thirdweb_smart_account_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) COMMENT 'email|google|apple|metamask|walletconnect|discord|telegram',
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(50) COMMENT 'in-app|external',
ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS migration_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_auth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS wallet_metadata JSON;

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_thirdweb_wallet ON goodhive.users(thirdweb_wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_smart_account ON goodhive.users(thirdweb_smart_account_address);
CREATE INDEX IF NOT EXISTS idx_users_migration_status ON goodhive.users(migration_status);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON goodhive.users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON goodhive.users(auth_method);

-- Step 3: Create comprehensive wallet migration tracking table
CREATE TABLE IF NOT EXISTS goodhive.wallet_migrations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  okto_wallet_address VARCHAR(255),
  thirdweb_wallet_address VARCHAR(255),
  smart_account_address VARCHAR(255),
  migration_status VARCHAR(20) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  migration_type VARCHAR(50) COMMENT 'auto|manual|forced|emergency',
  error_message TEXT,
  error_stack TEXT,
  retry_count INT DEFAULT 0,
  metadata JSON COMMENT 'Additional migration metadata including timestamps, user agent, etc.',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_wallet_migrations_user (user_id, migration_status),
  INDEX idx_wallet_migrations_date (created_at),
  INDEX idx_wallet_migrations_status (migration_status),
  INDEX idx_wallet_migrations_type (migration_type),
  
  -- Foreign key constraint
  FOREIGN KEY fk_wallet_migrations_user (user_id) REFERENCES goodhive.users(userid)
    ON DELETE CASCADE ON UPDATE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Tracks wallet migration progress from Okto to Thirdweb';

-- Step 4: Create user wallet history table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS goodhive.user_wallet_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_type VARCHAR(50) COMMENT 'okto|thirdweb|external|smart-account',
  action VARCHAR(20) NOT NULL CHECK (action IN ('connected', 'disconnected', 'migrated', 'verified', 'failed')),
  auth_provider VARCHAR(50) COMMENT 'email|google|metamask|walletconnect|etc',
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSON,
  location_info JSON,
  metadata JSON COMMENT 'Additional context like connection time, errors, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance and analytics
  INDEX idx_wallet_history_user_action (user_id, action),
  INDEX idx_wallet_history_wallet (wallet_address),
  INDEX idx_wallet_history_date (created_at),
  INDEX idx_wallet_history_action (action),
  INDEX idx_wallet_history_provider (auth_provider),
  INDEX idx_wallet_history_type (wallet_type)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete audit trail of all wallet-related user actions';

-- Step 5: Create migration analytics view for monitoring and reporting
CREATE OR REPLACE VIEW goodhive.migration_analytics AS
SELECT 
  DATE(wm.created_at) as migration_date,
  COUNT(*) as total_migration_attempts,
  SUM(CASE WHEN wm.migration_status = 'completed' THEN 1 ELSE 0 END) as successful_migrations,
  SUM(CASE WHEN wm.migration_status = 'failed' THEN 1 ELSE 0 END) as failed_migrations,
  SUM(CASE WHEN wm.migration_status = 'pending' THEN 1 ELSE 0 END) as pending_migrations,
  SUM(CASE WHEN wm.migration_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_migrations,
  ROUND(AVG(CASE WHEN wm.migration_status = 'completed' THEN 1 ELSE 0 END) * 100, 2) as success_rate_percent,
  AVG(TIMESTAMPDIFF(SECOND, wm.started_at, wm.completed_at)) as avg_migration_time_seconds,
  MIN(TIMESTAMPDIFF(SECOND, wm.started_at, wm.completed_at)) as min_migration_time_seconds,
  MAX(TIMESTAMPDIFF(SECOND, wm.started_at, wm.completed_at)) as max_migration_time_seconds,
  COUNT(DISTINCT wm.user_id) as unique_users_attempted,
  COUNT(DISTINCT CASE WHEN wm.migration_status = 'completed' THEN wm.user_id END) as unique_users_completed
FROM goodhive.wallet_migrations wm
WHERE wm.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(wm.created_at)
ORDER BY migration_date DESC;

-- Step 6: Create wallet activity summary view
CREATE OR REPLACE VIEW goodhive.wallet_activity_summary AS
SELECT 
  u.userid,
  u.email,
  u.wallet_address as external_wallet,
  u.okto_wallet_address,
  u.thirdweb_wallet_address,
  u.thirdweb_smart_account_address,
  u.auth_provider,
  u.auth_method,
  u.migration_status,
  u.migration_date,
  u.last_auth_provider,
  
  -- Migration info
  wm.migration_type,
  wm.started_at as migration_started,
  wm.completed_at as migration_completed,
  wm.retry_count,
  
  -- Activity counts
  (SELECT COUNT(*) FROM goodhive.user_wallet_history uwh 
   WHERE uwh.user_id = u.userid) as total_wallet_actions,
   
  (SELECT MAX(created_at) FROM goodhive.user_wallet_history uwh 
   WHERE uwh.user_id = u.userid) as last_wallet_activity,
   
  -- Status flags
  CASE WHEN u.thirdweb_wallet_address IS NOT NULL THEN 'migrated' 
       WHEN u.okto_wallet_address IS NOT NULL THEN 'okto_user'
       WHEN u.wallet_address IS NOT NULL THEN 'external_user'
       ELSE 'no_wallet' END as wallet_status
       
FROM goodhive.users u
LEFT JOIN goodhive.wallet_migrations wm ON u.userid = wm.user_id 
  AND wm.migration_status = 'completed'
ORDER BY u.created_at DESC;

-- Step 7: Create error tracking table for debugging migration issues
CREATE TABLE IF NOT EXISTS goodhive.migration_error_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  wallet_address VARCHAR(255),
  error_type VARCHAR(100) NOT NULL COMMENT 'connection_failed|verification_failed|migration_failed|etc',
  error_code VARCHAR(50),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSON COMMENT 'Additional context like request data, environment info, etc.',
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  -- Indexes for debugging and monitoring
  INDEX idx_error_logs_type (error_type),
  INDEX idx_error_logs_user (user_id),
  INDEX idx_error_logs_date (created_at),
  INDEX idx_error_logs_resolved (resolved),
  INDEX idx_error_logs_wallet (wallet_address)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Centralized error tracking for migration debugging';

-- Step 8: Add triggers for automatic logging (optional - can be enabled later)
-- This trigger automatically logs migration status changes
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_users_migration_status_change
AFTER UPDATE ON goodhive.users
FOR EACH ROW
BEGIN
  IF OLD.migration_status != NEW.migration_status THEN
    INSERT INTO goodhive.user_wallet_history (
      user_id, 
      wallet_address, 
      wallet_type,
      action, 
      auth_provider,
      metadata
    ) VALUES (
      NEW.userid,
      COALESCE(NEW.thirdweb_wallet_address, NEW.okto_wallet_address, NEW.wallet_address, 'unknown'),
      CASE 
        WHEN NEW.thirdweb_wallet_address IS NOT NULL THEN 'thirdweb'
        WHEN NEW.okto_wallet_address IS NOT NULL THEN 'okto'
        ELSE 'external'
      END,
      CASE NEW.migration_status
        WHEN 'completed' THEN 'migrated'
        WHEN 'failed' THEN 'failed'
        ELSE 'migrated'
      END,
      NEW.auth_provider,
      JSON_OBJECT(
        'old_status', OLD.migration_status,
        'new_status', NEW.migration_status,
        'trigger', 'migration_status_change',
        'timestamp', NOW()
      )
    );
  END IF;
END$$
DELIMITER ;

-- Step 9: Insert initial data for existing users (mark them as pending migration)
UPDATE goodhive.users 
SET migration_status = 'pending'
WHERE okto_wallet_address IS NOT NULL 
  AND thirdweb_wallet_address IS NULL 
  AND migration_status IS NULL;

-- Step 10: Create helpful stored procedures for migration management

-- Procedure to get migration statistics
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS GetMigrationStats()
BEGIN
  SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN okto_wallet_address IS NOT NULL THEN 1 ELSE 0 END) as okto_users,
    SUM(CASE WHEN thirdweb_wallet_address IS NOT NULL THEN 1 ELSE 0 END) as thirdweb_users,
    SUM(CASE WHEN migration_status = 'completed' THEN 1 ELSE 0 END) as migrated_users,
    SUM(CASE WHEN migration_status = 'pending' THEN 1 ELSE 0 END) as pending_migration,
    SUM(CASE WHEN migration_status = 'failed' THEN 1 ELSE 0 END) as failed_migrations,
    ROUND(
      SUM(CASE WHEN migration_status = 'completed' THEN 1 ELSE 0 END) * 100.0 / 
      NULLIF(SUM(CASE WHEN okto_wallet_address IS NOT NULL THEN 1 ELSE 0 END), 0), 
      2
    ) as migration_success_rate
  FROM goodhive.users;
END$$
DELIMITER ;

-- Procedure to safely rollback a user's migration
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS RollbackUserMigration(IN user_id_param VARCHAR(255))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Update user record
  UPDATE goodhive.users 
  SET migration_status = 'pending',
      thirdweb_wallet_address = NULL,
      thirdweb_smart_account_address = NULL,
      migration_date = NULL
  WHERE userid = user_id_param;
  
  -- Log the rollback
  INSERT INTO goodhive.wallet_migrations (
    user_id, migration_status, migration_type, 
    started_at, completed_at, metadata
  ) VALUES (
    user_id_param, 'rolled_back', 'manual',
    NOW(), NOW(),
    JSON_OBJECT('reason', 'manual_rollback', 'timestamp', NOW())
  );
  
  COMMIT;
END$$
DELIMITER ;

-- ========================================
-- MIGRATION COMPLETION VERIFICATION
-- ========================================

-- Verify all tables were created successfully
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'goodhive' 
          AND table_name IN ('wallet_migrations', 'user_wallet_history', 'migration_error_logs')) = 3
    THEN 'SUCCESS: All tables created'
    ELSE 'ERROR: Some tables missing'
  END as table_creation_status;

-- Verify all columns were added
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_schema = 'goodhive' 
          AND table_name = 'users'
          AND column_name IN (
            'thirdweb_wallet_address', 
            'thirdweb_smart_account_address',
            'auth_provider',
            'auth_method', 
            'migration_status',
            'migration_date',
            'last_auth_provider',
            'wallet_metadata'
          )) = 8
    THEN 'SUCCESS: All user columns added'
    ELSE 'ERROR: Some user columns missing'
  END as column_creation_status;

-- Show migration readiness summary
SELECT 
  'Thirdweb Migration Database Setup Complete' as status,
  NOW() as completed_at,
  '✅ Ready for Thirdweb integration' as next_steps;