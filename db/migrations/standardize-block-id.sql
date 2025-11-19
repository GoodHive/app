-- Migration: Standardize block_id usage across job system
-- This migration ensures block_id is properly indexed and constrained

-- Ensure block_id column exists (it should from previous migrations)
ALTER TABLE goodhive.job_offers
ADD COLUMN IF NOT EXISTS block_id VARCHAR(50) DEFAULT NULL;

-- Add unique constraint on block_id (each block_id should be unique)
ALTER TABLE goodhive.job_offers
ADD CONSTRAINT unique_block_id UNIQUE (block_id);

-- Create index for fast block_id lookups
CREATE INDEX IF NOT EXISTS idx_job_offers_block_id ON goodhive.job_offers(block_id);

-- Update any existing jobs without block_id to have one
-- This ensures backward compatibility
UPDATE goodhive.job_offers
SET block_id = CONCAT(EXTRACT(EPOCH FROM posted_at)::bigint * 1000, LPAD((id % 1000000)::text, 6, '0'))
WHERE block_id IS NULL OR block_id = '';

-- Add NOT NULL constraint after updating existing records
ALTER TABLE goodhive.job_offers
ALTER COLUMN block_id SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN goodhive.job_offers.block_id IS 'Unique identifier for blockchain operations, used consistently across all job interactions';

-- Update job_transactions table to ensure it references block_id properly
-- This ensures blockchain transaction tracking uses consistent identifiers
ALTER TABLE goodhive.job_transactions
ADD COLUMN IF NOT EXISTS job_block_id VARCHAR(50);

-- Create index for job_transactions.job_block_id
CREATE INDEX IF NOT EXISTS idx_job_transactions_job_block_id ON goodhive.job_transactions(job_block_id);

-- Update job_balances table to track by block_id as well
ALTER TABLE goodhive.job_balances
ADD COLUMN IF NOT EXISTS job_block_id VARCHAR(50);

-- Create index for job_balances.job_block_id
CREATE INDEX IF NOT EXISTS idx_job_balances_job_block_id ON goodhive.job_balances(job_block_id);

-- Add foreign key constraints to maintain data integrity
ALTER TABLE goodhive.job_transactions
ADD CONSTRAINT fk_job_transactions_block_id
FOREIGN KEY (job_block_id) REFERENCES goodhive.job_offers(block_id) ON DELETE CASCADE;

ALTER TABLE goodhive.job_balances
ADD CONSTRAINT fk_job_balances_block_id
FOREIGN KEY (job_block_id) REFERENCES goodhive.job_offers(block_id) ON DELETE CASCADE;

-- Verify the migration worked
SELECT
    COUNT(*) as total_jobs,
    COUNT(block_id) as jobs_with_block_id,
    COUNT(DISTINCT block_id) as unique_block_ids
FROM goodhive.job_offers;