-- Add blockchain-related fields to job_offers table

-- Add blockchain job ID (references the ID from the smart contract)
ALTER TABLE goodhive.job_offers
ADD COLUMN IF NOT EXISTS blockchain_job_id INTEGER DEFAULT NULL;

-- Add transaction hash for tracking blockchain transactions
ALTER TABLE goodhive.job_offers
ADD COLUMN IF NOT EXISTS creation_tx_hash VARCHAR(66) DEFAULT NULL;

-- Add blockchain status tracking
ALTER TABLE goodhive.job_offers
ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(20) DEFAULT 'pending' CHECK (blockchain_status IN ('pending', 'confirmed', 'failed'));

-- Add token contract address used for payments
ALTER TABLE goodhive.job_offers
ADD COLUMN IF NOT EXISTS payment_token_address VARCHAR(42) DEFAULT NULL;

-- Add contract address reference (in case we deploy multiple versions)
ALTER TABLE goodhive.job_offers
ADD COLUMN IF NOT EXISTS contract_address VARCHAR(42) DEFAULT NULL;

-- Update wallet_address column to be properly sized for Ethereum addresses
ALTER TABLE goodhive.job_offers
ALTER COLUMN wallet_address TYPE VARCHAR(42);

-- Create indexes for blockchain-related queries
CREATE INDEX IF NOT EXISTS idx_job_offers_blockchain_job_id ON goodhive.job_offers(blockchain_job_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_blockchain_status ON goodhive.job_offers(blockchain_status);
CREATE INDEX IF NOT EXISTS idx_job_offers_wallet_address ON goodhive.job_offers(wallet_address);

-- Create table for tracking blockchain transactions
CREATE TABLE IF NOT EXISTS goodhive.job_transactions (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
    blockchain_job_id INTEGER,
    transaction_hash VARCHAR(66) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('create_job', 'add_funds', 'withdraw_funds', 'pay_fees')),
    amount NUMERIC(36, 18) DEFAULT NULL, -- Support for 18 decimal places
    token_address VARCHAR(42) DEFAULT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) DEFAULT NULL,
    gas_used INTEGER DEFAULT NULL,
    gas_price BIGINT DEFAULT NULL,
    block_number INTEGER DEFAULT NULL,
    block_hash VARCHAR(66) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for job_transactions table
CREATE INDEX IF NOT EXISTS idx_job_transactions_job_id ON goodhive.job_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_transactions_blockchain_job_id ON goodhive.job_transactions(blockchain_job_id);
CREATE INDEX IF NOT EXISTS idx_job_transactions_tx_hash ON goodhive.job_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_job_transactions_type ON goodhive.job_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_job_transactions_status ON goodhive.job_transactions(status);

-- Create table for tracking job balances (cache for quick access)
CREATE TABLE IF NOT EXISTS goodhive.job_balances (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES goodhive.job_offers(id) ON DELETE CASCADE,
    blockchain_job_id INTEGER NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    balance NUMERIC(36, 18) DEFAULT 0, -- Current balance in the smart contract
    total_deposited NUMERIC(36, 18) DEFAULT 0, -- Total amount ever deposited
    total_withdrawn NUMERIC(36, 18) DEFAULT 0, -- Total amount ever withdrawn
    total_fees_paid NUMERIC(36, 18) DEFAULT 0, -- Total fees paid to platform
    last_sync_block INTEGER DEFAULT NULL, -- Last block number when balance was synced
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, blockchain_job_id, token_address)
);

-- Create indexes for job_balances table
CREATE INDEX IF NOT EXISTS idx_job_balances_job_id ON goodhive.job_balances(job_id);
CREATE INDEX IF NOT EXISTS idx_job_balances_blockchain_job_id ON goodhive.job_balances(blockchain_job_id);

-- Update companies table to store wallet addresses properly
ALTER TABLE goodhive.companies
ALTER COLUMN wallet_address TYPE VARCHAR(42);

-- Add wallet connection tracking
ALTER TABLE goodhive.companies
ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMP DEFAULT NULL;

-- Create trigger to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_job_transactions_updated_at ON goodhive.job_transactions;
CREATE TRIGGER update_job_transactions_updated_at
    BEFORE UPDATE ON goodhive.job_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_balances_updated_at ON goodhive.job_balances;
CREATE TRIGGER update_job_balances_updated_at
    BEFORE UPDATE ON goodhive.job_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN goodhive.job_offers.blockchain_job_id IS 'Job ID from the smart contract';
COMMENT ON COLUMN goodhive.job_offers.creation_tx_hash IS 'Transaction hash when job was created on blockchain';
COMMENT ON COLUMN goodhive.job_offers.blockchain_status IS 'Status of job creation on blockchain';
COMMENT ON COLUMN goodhive.job_offers.payment_token_address IS 'ERC20 token contract address for payments';
COMMENT ON COLUMN goodhive.job_offers.contract_address IS 'JobManager contract address used';

COMMENT ON TABLE goodhive.job_transactions IS 'Tracks all blockchain transactions related to jobs';
COMMENT ON TABLE goodhive.job_balances IS 'Cached job balance information from blockchain';

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON goodhive.job_transactions TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON goodhive.job_balances TO your_app_user;
-- GRANT USAGE ON SEQUENCE goodhive.job_transactions_id_seq TO your_app_user;
-- GRANT USAGE ON SEQUENCE goodhive.job_balances_id_seq TO your_app_user;