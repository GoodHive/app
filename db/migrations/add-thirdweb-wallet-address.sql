-- Database migration: Add thirdweb_wallet_address for distinguishing in-app wallets
-- Created: 2025-01-03
-- Purpose: Separate external wallets (MetaMask) from in-app wallets (social/email logins)

-- Step 1: Add thirdweb_wallet_address column
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS thirdweb_wallet_address TEXT;

-- Step 2: Add wallet_type to track the type of wallet
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS wallet_type TEXT CHECK (wallet_type IN ('external', 'in-app', 'both'));

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_thirdweb_wallet ON goodhive.users(LOWER(thirdweb_wallet_address));

-- Step 4: Update existing users to set wallet_type based on current data
-- Assume existing wallet_address entries are external wallets
UPDATE goodhive.users 
SET wallet_type = 'external'
WHERE wallet_address IS NOT NULL 
  AND wallet_type IS NULL;

-- Step 5: Create function to find user by any wallet address
CREATE OR REPLACE FUNCTION goodhive.find_user_by_wallet(
    input_wallet_address TEXT
)
RETURNS TABLE(
    userid INTEGER,
    email TEXT,
    wallet_address TEXT,
    thirdweb_wallet_address TEXT,
    wallet_type TEXT,
    auth_method TEXT
) AS $$
BEGIN
    -- Check external wallet
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address, 
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(u.wallet_address) = LOWER(input_wallet_address)
      AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Check thirdweb wallet
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address,
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(u.thirdweb_wallet_address) = LOWER(input_wallet_address)
      AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Check merged wallets
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address,
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(input_wallet_address) = ANY(
        SELECT LOWER(unnest(u.merged_wallet_addresses))
    )
    AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to update wallet addresses based on type
CREATE OR REPLACE FUNCTION goodhive.update_user_wallet(
    user_id INTEGER,
    new_wallet_address TEXT,
    is_thirdweb_wallet BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    IF is_thirdweb_wallet THEN
        -- Update thirdweb wallet
        UPDATE goodhive.users
        SET 
            thirdweb_wallet_address = new_wallet_address,
            wallet_type = CASE
                WHEN wallet_address IS NOT NULL THEN 'both'
                ELSE 'in-app'
            END,
            updated_at = NOW()
        WHERE userid = user_id;
    ELSE
        -- Update external wallet
        UPDATE goodhive.users
        SET 
            wallet_address = new_wallet_address,
            wallet_type = CASE
                WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                ELSE 'external'
            END,
            updated_at = NOW()
        WHERE userid = user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN goodhive.users.thirdweb_wallet_address IS 'Wallet address from Thirdweb in-app wallet (social/email logins)';
COMMENT ON COLUMN goodhive.users.wallet_address IS 'External wallet address (MetaMask, WalletConnect, etc.)';
COMMENT ON COLUMN goodhive.users.wallet_type IS 'Type of wallet: external, in-app, or both';
COMMENT ON FUNCTION goodhive.find_user_by_wallet IS 'Finds user by any type of wallet address';
COMMENT ON FUNCTION goodhive.update_user_wallet IS 'Updates user wallet address based on type';