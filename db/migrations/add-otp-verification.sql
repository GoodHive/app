-- Database migration: Add OTP verification support
-- Created: 2025-01-09
-- Purpose: Support email verification with OTP for social login users

-- Step 1: Create OTP verification table
CREATE TABLE IF NOT EXISTS goodhive.user_otp_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    otp_code VARCHAR(255) NOT NULL, -- Hashed OTP
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_attempt_at TIMESTAMP,
    CONSTRAINT unique_email_otp UNIQUE(email)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_email ON goodhive.user_otp_verifications(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_otp_expires ON goodhive.user_otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_wallet ON goodhive.user_otp_verifications(LOWER(wallet_address));

-- Step 3: Add OTP-related columns to users table if not exists
ALTER TABLE goodhive.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP;

-- Step 4: Create function to clean up expired OTPs (runs periodically)
CREATE OR REPLACE FUNCTION goodhive.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM goodhive.user_otp_verifications
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to check OTP rate limiting
CREATE OR REPLACE FUNCTION goodhive.check_otp_rate_limit(
    user_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    otp_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO otp_count
    FROM goodhive.user_otp_verifications
    WHERE LOWER(email) = LOWER(user_email)
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN otp_count < 3; -- Allow max 3 OTPs per hour
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add comment descriptions
COMMENT ON TABLE goodhive.user_otp_verifications IS 'Stores OTP codes for email verification during social login';
COMMENT ON COLUMN goodhive.user_otp_verifications.otp_code IS 'SHA256 hashed OTP code for security';
COMMENT ON COLUMN goodhive.user_otp_verifications.attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN goodhive.users.email_verified IS 'Whether the user has verified their email address';

-- Step 7: Grant necessary permissions (adjust based on your database user)
-- GRANT ALL ON TABLE goodhive.user_otp_verifications TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE goodhive.user_otp_verifications_id_seq TO your_app_user;