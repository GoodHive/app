-- Simplified OTP verification migration
-- Run this if the main migration fails

-- Create table if not exists
CREATE TABLE IF NOT EXISTS goodhive.user_otp_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_attempt_at TIMESTAMP
);

-- Add unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_email_otp'
    ) THEN
        ALTER TABLE goodhive.user_otp_verifications 
        ADD CONSTRAINT unique_email_otp UNIQUE(email);
    END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_otp_email 
ON goodhive.user_otp_verifications(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_otp_expires 
ON goodhive.user_otp_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_otp_wallet 
ON goodhive.user_otp_verifications(LOWER(wallet_address));

-- Add columns to users table if not exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'goodhive' 
        AND table_name = 'users' 
        AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE goodhive.users 
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'goodhive' 
        AND table_name = 'users' 
        AND column_name = 'email_verification_token'
    ) THEN
        ALTER TABLE goodhive.users 
        ADD COLUMN email_verification_token TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'goodhive' 
        AND table_name = 'users' 
        AND column_name = 'email_verification_sent_at'
    ) THEN
        ALTER TABLE goodhive.users 
        ADD COLUMN email_verification_sent_at TIMESTAMP;
    END IF;
END $$;