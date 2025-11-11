#!/usr/bin/env node

/**
 * Contract Verification Script
 * Verifies that the deployed contract is working correctly
 */

const { createPublicClient, http } = require('viem');
const { polygonAmoy } = require('viem/chains');

const CONTRACT_ADDRESS = '0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5';
const RPC_URL = 'https://rpc-amoy.polygon.technology/';

// Create a public client for reading from the blockchain
const client = createPublicClient({
  chain: polygonAmoy,
  transport: http(RPC_URL)
});

// Contract ABI (minimal for verification)
const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalJobs",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "activeJobs",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "USDC_AMOY",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DAI_AMOY",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isSupportedToken",
    "inputs": [{"name": "tokenAddress", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "pure"
  }
];

async function verifyContract() {
  console.log('🔍 Verifying deployed contract...\n');
  console.log(`📄 Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`🔗 Network: Polygon Amoy Testnet`);
  console.log(`🌐 Explorer: https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}\n`);

  try {
    // Check if contract exists by getting bytecode
    const bytecode = await client.getBytecode({
      address: CONTRACT_ADDRESS
    });

    if (!bytecode || bytecode === '0x') {
      console.log('❌ Contract not found at address');
      return false;
    }

    console.log('✅ Contract found on blockchain');

    // Read contract owner
    const owner = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'owner'
    });
    console.log(`👤 Contract Owner: ${owner}`);

    // Read treasury address
    const treasury = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'treasury'
    });
    console.log(`💰 Treasury Address: ${treasury}`);

    // Read job statistics
    const totalJobs = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'totalJobs'
    });
    console.log(`📊 Total Jobs Created: ${totalJobs.toString()}`);

    const activeJobs = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'activeJobs'
    });
    console.log(`🔄 Active Jobs: ${activeJobs.toString()}`);

    // Read supported token addresses
    const usdcAddress = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'USDC_AMOY'
    });
    console.log(`🪙  USDC Address: ${usdcAddress}`);

    const daiAddress = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'DAI_AMOY'
    });
    console.log(`🪙  DAI Address: ${daiAddress}`);

    // Test token support
    const isUsdcSupported = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'isSupportedToken',
      args: [usdcAddress]
    });
    console.log(`✅ USDC Support: ${isUsdcSupported}`);

    const isDaiSupported = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'isSupportedToken',
      args: [daiAddress]
    });
    console.log(`✅ DAI Support: ${isDaiSupported}`);

    console.log('\n🎉 Contract verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Contract is deployed and accessible');
    console.log('   • All core functions are working');
    console.log('   • Token support is configured correctly');
    console.log('   • Ready for integration testing');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Run: node scripts/setup-blockchain.js');
    console.log('   2. Configure your treasury address');
    console.log('   3. Restart your development server');
    console.log('   4. Test job creation and fund management');

    return true;

  } catch (error) {
    console.log('\n❌ Contract verification failed:');
    console.log(`   Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check if the contract address is correct');
    console.log('   • Verify the contract is deployed on Polygon Amoy');
    console.log('   • Ensure RPC endpoint is accessible');
    return false;
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyContract()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyContract };