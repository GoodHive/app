-- Create a test company profile for testing blockchain integration
-- Replace 'your-test-user-id' with an actual UUID

-- First, let's create a test user UUID (you can replace this with your actual user ID)
-- Generate a random UUID for testing:
INSERT INTO goodhive.companies (
    user_id,
    headline,
    designation,
    address,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    wallet_address,
    approved,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- Test UUID - replace with your actual user_id
    'Test Company - Blockchain Integration Testing',
    'CEO',
    '123 Test Street',
    'United States',
    'Test City',
    '+1',
    '1234567890',
    'test@goodhive.com',
    '0xed948545Ec9e86678979e05cbafc39ef92BBda80', -- Your wallet address
    true, -- Set to approved
    'active'
)
ON CONFLICT (user_id)
DO UPDATE SET
    headline = EXCLUDED.headline,
    wallet_address = EXCLUDED.wallet_address,
    approved = EXCLUDED.approved,
    status = EXCLUDED.status;

-- Check the result
SELECT user_id, headline, wallet_address, approved FROM goodhive.companies
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';