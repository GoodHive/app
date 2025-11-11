-- Migration to add wallet authentication support
-- Run this SQL script in your PostgreSQL database

-- Add wallet_address column to users table
ALTER TABLE goodhive.users 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email';

-- Create unique index on wallet_address (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address_lower 
ON goodhive.users (LOWER(wallet_address)) 
WHERE wallet_address IS NOT NULL;

-- Create index on auth_method for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_method 
ON goodhive.users (auth_method);

-- Update existing users to have 'email' as their auth_method
UPDATE goodhive.users 
SET auth_method = 'email' 
WHERE auth_method IS NULL OR auth_method = '';

-- Add comments for documentation
COMMENT ON COLUMN goodhive.users.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN goodhive.users.auth_method IS 'Authentication method: email, wallet, or hybrid';

-- Optional: Create a view for user authentication info
CREATE OR REPLACE VIEW goodhive.user_auth_info AS
SELECT 
    userid,
    email,
    wallet_address,
    auth_method,
    CASE 
        WHEN wallet_address IS NOT NULL AND email IS NOT NULL THEN 'hybrid'
        WHEN wallet_address IS NOT NULL THEN 'wallet'
        ELSE 'email'
    END as effective_auth_method,
    created_at,
    last_login
FROM goodhive.users;

COMMENT ON VIEW goodhive.user_auth_info IS 'User authentication information with computed effective auth method';