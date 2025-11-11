-- Database cleanup: Remove unnecessary columns from users table
-- Created: 2025-01-03
-- Purpose: Remove legacy and unused columns after Thirdweb integration

-- Step 1: Display columns that will be dropped for confirmation
SELECT 
    'Columns to be dropped:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'goodhive'
    AND column_name IN (
        'okto_wallet_address',
        'login_method', 
        'thirdweb_wallet_address',
        'google_auth_id',
        'auth_provider',
        'last_auth_provider',
        'migration_date',
        'migration_status',
        'wallet_metadata'
    )
ORDER BY column_name;

-- Step 2: Check for any data in these columns before dropping
SELECT 
    COUNT(*) FILTER (WHERE okto_wallet_address IS NOT NULL) as okto_count,
    COUNT(*) FILTER (WHERE login_method IS NOT NULL) as login_method_count,
    COUNT(*) FILTER (WHERE thirdweb_wallet_address IS NOT NULL) as thirdweb_wallet_count,
    COUNT(*) FILTER (WHERE google_auth_id IS NOT NULL) as google_auth_count,
    COUNT(*) FILTER (WHERE auth_provider IS NOT NULL) as auth_provider_count,
    COUNT(*) FILTER (WHERE last_auth_provider IS NOT NULL) as last_auth_provider_count,
    COUNT(*) FILTER (WHERE migration_date IS NOT NULL) as migration_date_count,
    COUNT(*) FILTER (WHERE migration_status IS NOT NULL) as migration_status_count,
    COUNT(*) FILTER (WHERE wallet_metadata IS NOT NULL) as wallet_metadata_count
FROM goodhive.users;

-- Step 3: Drop the unnecessary columns
-- IMPORTANT: This action is irreversible. Ensure you have a backup!
ALTER TABLE goodhive.users
DROP COLUMN IF EXISTS okto_wallet_address,
DROP COLUMN IF EXISTS login_method,
DROP COLUMN IF EXISTS thirdweb_wallet_address,
DROP COLUMN IF EXISTS google_auth_id,
DROP COLUMN IF EXISTS auth_provider,
DROP COLUMN IF EXISTS last_auth_provider,
DROP COLUMN IF EXISTS migration_date,
DROP COLUMN IF EXISTS migration_status,
DROP COLUMN IF EXISTS wallet_metadata;

-- Step 4: Verify cleanup - show remaining columns
SELECT 
    'Remaining columns after cleanup:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'goodhive'
ORDER BY ordinal_position;

-- Step 5: Show summary of active authentication methods
SELECT 
    auth_method,
    COUNT(*) as user_count,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
FROM goodhive.users 
WHERE auth_method IS NOT NULL
GROUP BY auth_method
ORDER BY user_count DESC;

COMMENT ON TABLE goodhive.users IS 'User accounts with cleaned up schema - removed legacy Okto and unused columns';