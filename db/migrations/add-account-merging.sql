-- Database migration: Add account merging support for legacy users
-- Created: 2025-01-03
-- Purpose: Allow merging of duplicate accounts and linking email to wallet-only accounts

-- Step 1: Add columns for account merging
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS merged_wallet_addresses TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS merged_from_user_ids INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON goodhive.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_merged_wallets ON goodhive.users USING GIN(merged_wallet_addresses);

-- Step 3: Function to check for duplicate accounts
CREATE OR REPLACE FUNCTION goodhive.find_duplicate_accounts(
    check_email TEXT,
    check_wallet_address TEXT
)
RETURNS TABLE(
    userid INTEGER,
    email TEXT,
    wallet_address TEXT,
    auth_method TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.auth_method, u.created_at
    FROM goodhive.users u
    WHERE (
        (check_email IS NOT NULL AND LOWER(u.email) = LOWER(check_email))
        OR 
        (check_wallet_address IS NOT NULL AND LOWER(u.wallet_address) = LOWER(check_wallet_address))
        OR
        (check_wallet_address IS NOT NULL AND LOWER(check_wallet_address) = ANY(
            SELECT LOWER(unnest(u.merged_wallet_addresses))
        ))
    )
    ORDER BY u.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Function to merge accounts
CREATE OR REPLACE FUNCTION goodhive.merge_user_accounts(
    primary_user_id INTEGER,
    secondary_user_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    secondary_wallet TEXT;
    secondary_email TEXT;
    secondary_merged_wallets TEXT[];
    secondary_merged_ids INTEGER[];
BEGIN
    -- Get secondary account details
    SELECT wallet_address, email, merged_wallet_addresses, merged_from_user_ids
    INTO secondary_wallet, secondary_email, secondary_merged_wallets, secondary_merged_ids
    FROM goodhive.users
    WHERE userid = secondary_user_id;
    
    -- Update primary account with merged data
    UPDATE goodhive.users
    SET 
        merged_wallet_addresses = array_cat(
            merged_wallet_addresses,
            array_append(COALESCE(secondary_merged_wallets, '{}'), secondary_wallet)
        ),
        merged_from_user_ids = array_cat(
            merged_from_user_ids,
            array_append(COALESCE(secondary_merged_ids, '{}'), secondary_user_id)
        ),
        email = COALESCE(email, secondary_email),
        auth_method = CASE 
            WHEN email IS NOT NULL AND wallet_address IS NOT NULL THEN 'hybrid'
            WHEN email IS NOT NULL THEN 'email'
            ELSE 'wallet'
        END
    WHERE userid = primary_user_id;
    
    -- Mark secondary account as merged (soft delete)
    UPDATE goodhive.users
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        email = email || '_merged_' || secondary_user_id::TEXT,
        wallet_address = wallet_address || '_merged_' || secondary_user_id::TEXT
    WHERE userid = secondary_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Function to add email to wallet-only account
CREATE OR REPLACE FUNCTION goodhive.add_email_to_wallet_account(
    user_id INTEGER,
    new_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if email already exists for another user
    IF EXISTS (
        SELECT 1 FROM goodhive.users 
        WHERE LOWER(email) = LOWER(new_email) 
        AND userid != user_id
        AND (is_deleted IS NULL OR is_deleted = FALSE)
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update user with email
    UPDATE goodhive.users
    SET 
        email = new_email,
        auth_method = CASE 
            WHEN wallet_address IS NOT NULL THEN 'hybrid'
            ELSE 'email'
        END,
        email_verified = FALSE,
        updated_at = NOW()
    WHERE userid = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add soft delete columns if not exists
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Step 7: Create view for active users only
CREATE OR REPLACE VIEW goodhive.active_users AS
SELECT * FROM goodhive.users
WHERE is_deleted IS NULL OR is_deleted = FALSE;

-- Step 8: Function to find account by email or wallet
CREATE OR REPLACE FUNCTION goodhive.find_user_account(
    input_email TEXT DEFAULT NULL,
    input_wallet_address TEXT DEFAULT NULL
)
RETURNS TABLE(
    userid INTEGER,
    email TEXT,
    wallet_address TEXT,
    auth_method TEXT,
    merged_wallet_addresses TEXT[],
    is_primary BOOLEAN
) AS $$
BEGIN
    -- First check by exact wallet match
    IF input_wallet_address IS NOT NULL THEN
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method, 
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(u.wallet_address) = LOWER(input_wallet_address)
          AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
        
        -- If found, return
        IF FOUND THEN
            RETURN;
        END IF;
        
        -- Check in merged wallets
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method,
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(input_wallet_address) = ANY(
            SELECT LOWER(unnest(u.merged_wallet_addresses))
        )
        AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
        
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;
    
    -- Check by email
    IF input_email IS NOT NULL THEN
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method,
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(u.email) = LOWER(input_email)
          AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION goodhive.merge_user_accounts IS 'Merges secondary account into primary account, preserving all wallet addresses';
COMMENT ON FUNCTION goodhive.add_email_to_wallet_account IS 'Adds email to a wallet-only account, converting it to hybrid auth';
COMMENT ON FUNCTION goodhive.find_duplicate_accounts IS 'Finds all accounts matching given email or wallet address';
COMMENT ON FUNCTION goodhive.find_user_account IS 'Finds user account by email or wallet, including merged accounts';