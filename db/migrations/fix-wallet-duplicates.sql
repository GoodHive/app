-- Fix duplicate wallet addresses before creating unique index

-- Step 1: Find and display duplicate wallet addresses
SELECT 
    LOWER(wallet_address) as wallet_addr,
    COUNT(*) as duplicate_count,
    array_agg(userid) as user_ids
FROM goodhive.users 
WHERE wallet_address IS NOT NULL
GROUP BY LOWER(wallet_address)
HAVING COUNT(*) > 1;

-- Step 2: Keep the first occurrence and remove duplicates
-- This will keep the user with the lowest userid for each wallet address
DELETE FROM goodhive.users 
WHERE userid IN (
    SELECT userid FROM (
        SELECT userid,
               ROW_NUMBER() OVER (
                   PARTITION BY LOWER(wallet_address) 
                   ORDER BY userid ASC
               ) as row_num
        FROM goodhive.users 
        WHERE wallet_address IS NOT NULL
    ) t
    WHERE t.row_num > 1
);

-- Step 3: Now create the unique index (should work without errors)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address_lower 
ON goodhive.users (LOWER(wallet_address)) 
WHERE wallet_address IS NOT NULL;

-- Step 4: Create index on auth_method for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_method 
ON goodhive.users (auth_method);

-- Step 5: Update existing users to have 'email' as their auth_method
UPDATE goodhive.users 
SET auth_method = 'email' 
WHERE auth_method IS NULL OR auth_method = '';

-- Step 6: Add comments for documentation
COMMENT ON COLUMN goodhive.users.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN goodhive.users.auth_method IS 'Authentication method: email, wallet, or hybrid';

-- Step 7: Verify the fix worked
SELECT 
    'Total users' as description,
    COUNT(*) as count
FROM goodhive.users
UNION ALL
SELECT 
    'Users with wallet' as description,
    COUNT(*) as count
FROM goodhive.users 
WHERE wallet_address IS NOT NULL
UNION ALL
SELECT 
    'Unique wallets' as description,
    COUNT(DISTINCT LOWER(wallet_address)) as count
FROM goodhive.users 
WHERE wallet_address IS NOT NULL;