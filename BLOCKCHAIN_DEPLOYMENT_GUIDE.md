# 🚀 GoodHive Blockchain Integration Deployment Guide

This guide will walk you through deploying and configuring the GoodHive blockchain integration.

## 📋 Prerequisites

- Node.js 18+ installed
- Wallet with MATIC for gas fees
- Access to your database
- Thirdweb account (free at [thirdweb.com](https://thirdweb.com))

## 🔧 Step 1: Environment Setup

### 1.1 Copy Environment Variables

```bash
cp .env.example .env.local
```

### 1.2 Configure Environment Variables

Update your `.env.local` file with the following:

```env
# Blockchain Configuration (Polygon Amoy Testnet)
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_CHAIN_NAME=polygon-amoy
NEXT_PUBLIC_BLOCK_EXPLORER=https://amoy.polygonscan.com/
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/

# For Production (Polygon Mainnet) - switch when ready
# NEXT_PUBLIC_CHAIN_ID=137
# NEXT_PUBLIC_CHAIN_NAME=polygon
# NEXT_PUBLIC_BLOCK_EXPLORER=https://polygonscan.com/
# POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com/

# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Contract Addresses (will be updated after deployment)
NEXT_PUBLIC_JOB_MANAGER_CONTRACT_ADDRESS=0x...

# Treasury address (your address for receiving fees)
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
```

## 🗃️ Step 2: Database Migration

Run the blockchain migration to add required tables:

```sql
-- Execute the migration file
\i database/migrations/add_blockchain_fields.sql
```

Or manually run:

```bash
psql $DATABASE_URL -f database/migrations/add_blockchain_fields.sql
```

## 📜 Step 3: Smart Contract Deployment

### 3.1 Using Remix IDE (Recommended)

1. **Open Remix IDE**: Go to [remix.ethereum.org](https://remix.ethereum.org)

2. **Create New File**: Create `GoodHiveJobManager.sol`

3. **Copy Contract Code**: Copy the entire contract code from `/contracts/GoodHiveJobManager.sol`

4. **Compile Contract**:
   - Go to "Solidity Compiler" tab
   - Select Solidity version `0.8.19`
   - Click "Compile GoodHiveJobManager.sol"

5. **Deploy Contract**:
   - Go to "Deploy & Run Transactions" tab
   - Select "Injected Provider - MetaMask"
   - Switch MetaMask to Polygon Amoy Testnet
   - Select `GoodHiveJobManager` contract
   - Enter your treasury address in the constructor field
   - Click "Deploy"
   - Confirm transaction in MetaMask

6. **Verify Contract** (Optional but recommended):
   - Go to [amoy.polygonscan.com](https://amoy.polygonscan.com)
   - Search for your contract address
   - Click "Contract" → "Verify and Publish"
   - Select "Solidity (Single file)"
   - Paste contract code and verify

### 3.2 Alternative: Using Thirdweb Deploy

1. **Install Thirdweb CLI**:
   ```bash
   npm install -g thirdweb-cli
   ```

2. **Deploy Contract**:
   ```bash
   npx thirdweb deploy contracts/GoodHiveJobManager.sol
   ```

3. **Follow the dashboard prompts to deploy**

## ⚙️ Step 4: Configuration Update

### 4.1 Update Environment Variables

After successful deployment, update your `.env.local`:

```env
# Add your deployed contract address
NEXT_PUBLIC_JOB_MANAGER_CONTRACT_ADDRESS=0x_your_deployed_contract_address

# Add your treasury address
NEXT_PUBLIC_TREASURY_ADDRESS=0x_your_treasury_address
```

### 4.2 Update Thirdweb Client ID

1. Go to [thirdweb.com](https://thirdweb.com) and create/login to your account
2. Create a new project
3. Copy your Client ID to `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`

## 🔄 Step 5: Application Restart

Restart your Next.js application to load the new environment variables:

```bash
pnpm dev
```

## ✅ Step 6: Testing the Integration

### 6.1 Test Job Creation

1. **Connect Wallet**: Ensure MetaMask is connected to Polygon Amoy
2. **Get Test Tokens**:
   - Get MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - Get test USDC from [Polygon USDC Faucet](https://faucet.polygon.technology/)

3. **Create a Job**:
   - Go to "Create Job" page
   - Fill in job details
   - Connect wallet when prompted
   - Click "Publish on Blockchain"
   - Confirm transaction in MetaMask

### 6.2 Test Fund Management

1. **Add Funds**:
   - Open a published job
   - Click "Manage Funds"
   - Switch to "Add Funds" tab
   - Enter amount and click "Add Funds to Job"
   - Approve token spending if prompted
   - Confirm transaction

2. **Withdraw Funds**:
   - Switch to "Withdraw" tab
   - Enter amount or click "Withdraw All"
   - Confirm transaction

3. **Pay Fees**:
   - Switch to "Pay Fees" tab
   - Enter base amount for fee calculation
   - Confirm transaction

## 🎯 Step 7: Production Deployment

When ready for production:

### 7.1 Switch to Mainnet

Update your `.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_CHAIN_NAME=polygon
NEXT_PUBLIC_BLOCK_EXPLORER=https://polygonscan.com/
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com/
```

### 7.2 Deploy to Mainnet

1. **Deploy contract to Polygon Mainnet** using the same process
2. **Update contract address** in environment variables
3. **Verify contract** on PolygonScan
4. **Test thoroughly** with small amounts first

## 📊 Supported Tokens

### Polygon Amoy (Testnet)
- **USDC**: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`
- **DAI**: `0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253`

### Polygon Mainnet (Production)
- **USDC**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- **DAI**: `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063`

## 💰 Fee Structure

The platform automatically calculates fees based on enabled services:

- **Talent Selection**: 10% of base amount
- **Recruiter Service**: 8% of base amount
- **Mentor Service**: 12% of base amount

Fees are paid directly to the treasury address specified during deployment.

## 🛠️ Troubleshooting

### Common Issues:

**1. "Contract not configured" error**
- Ensure `NEXT_PUBLIC_JOB_MANAGER_CONTRACT_ADDRESS` is set correctly
- Restart your application after updating environment variables

**2. "Token not supported" error**
- Verify you're using supported token addresses
- Check if you're on the correct network (Amoy vs Mainnet)

**3. Transaction failing**
- Ensure you have enough MATIC for gas fees
- Check if you have sufficient token balance
- Verify token approval for the contract

**4. Wallet connection issues**
- Clear browser cache and cookies
- Try different browser or incognito mode
- Update MetaMask to latest version

### Getting Help:

1. **Check Logs**: Look at browser console and server logs
2. **Verify Environment**: Double-check all environment variables
3. **Test on Testnet**: Always test thoroughly on Amoy before mainnet
4. **Contract Explorer**: Use PolygonScan to verify contract interactions

## 📝 Contract Functions Reference

### Read Functions:
- `getJob(jobId)` - Get job details
- `getJobBalance(jobId)` - Get current job balance
- `getUserJobs(address)` - Get jobs created by user
- `calculateTotalFees(jobId, amount)` - Calculate fees for amount
- `isSupportedToken(address)` - Check if token is supported

### Write Functions:
- `createJob(...)` - Create new job on blockchain
- `addFunds(jobId, amount)` - Add funds to job
- `withdrawFunds(jobId, amount)` - Withdraw specific amount
- `withdrawAllFunds(jobId)` - Withdraw all funds
- `payFees(jobId, amount)` - Pay platform fees

## 🔐 Security Considerations

1. **Never commit private keys** to version control
2. **Use environment variables** for all sensitive data
3. **Test thoroughly** on testnet before mainnet deployment
4. **Implement proper access controls** in your application
5. **Monitor contract interactions** for unusual activity
6. **Keep treasury keys secure** and consider multi-sig wallets for production

## 📈 Monitoring and Analytics

- **Track transaction hashes** in the database for audit trails
- **Monitor gas usage** and optimize if needed
- **Set up alerts** for failed transactions
- **Analyze user interactions** with blockchain features
- **Monitor contract balance** and fee collection

---

## 🎉 Congratulations!

Your GoodHive blockchain integration is now ready! Users can:

- ✅ Create jobs on the blockchain
- ✅ Add and withdraw funds securely
- ✅ Pay platform fees automatically
- ✅ Track all transactions transparently
- ✅ Benefit from decentralized job management

The integration provides a seamless Web2/Web3 hybrid experience while maintaining the security and transparency benefits of blockchain technology.

For additional support or advanced configurations, please refer to the [Thirdweb documentation](https://portal.thirdweb.com/) or create an issue in the project repository.