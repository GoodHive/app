#!/usr/bin/env node

/**
 * Direct contract test script to diagnose blockchain issues
 */

const { ethers } = require('ethers');

// Contract ABI for createJob function
const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "createJob",
    "inputs": [
      {"name": "databaseId", "type": "uint256"},
      {"name": "tokenAddress", "type": "address"},
      {"name": "chain", "type": "string"},
      {"name": "talentService", "type": "bool"},
      {"name": "recruiterService", "type": "bool"},
      {"name": "mentorService", "type": "bool"}
    ],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isDatabaseIdUsed",
    "inputs": [{"name": "databaseId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isSupportedToken",
    "inputs": [{"name": "tokenAddress", "type": "address"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "paused",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  }
];

const CONTRACT_ADDRESS = '0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5';
const USDC_AMOY = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';

async function testContract() {
  try {
    console.log('🔍 Testing Smart Contract Directly\n');
    console.log('Contract:', CONTRACT_ADDRESS);
    console.log('Network: Polygon Amoy Testnet\n');

    // Connect to Polygon Amoy
    const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');

    // Get network info
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network.name, 'Chain ID:', network.chainId.toString());

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Test 1: Check if contract is paused
    console.log('\n📋 Contract State Checks:');
    try {
      const isPaused = await contract.paused();
      console.log('  Contract Paused:', isPaused ? '❌ YES (cannot create jobs)' : '✅ NO');
    } catch (e) {
      console.log('  Contract Paused: ⚠️  Unable to check');
    }

    // Test 2: Check contract owner
    try {
      const owner = await contract.owner();
      console.log('  Contract Owner:', owner);
    } catch (e) {
      console.log('  Contract Owner: ⚠️  Unable to check');
    }

    // Test 3: Check if USDC token is supported
    console.log('\n💰 Token Support Check:');
    const isSupported = await contract.isSupportedToken(USDC_AMOY);
    console.log('  USDC_AMOY Supported:', isSupported ? '✅ YES' : '❌ NO');

    // Test 4: Check a database ID
    const testDbId = Math.floor(Math.random() * 1000000) + 100000;
    console.log('\n🆔 Database ID Check:');
    const isUsed = await contract.isDatabaseIdUsed(testDbId);
    console.log('  Database ID', testDbId, 'is:', isUsed ? '❌ Already Used' : '✅ Available');

    // Test 5: Estimate gas for createJob
    console.log('\n⛽ Gas Estimation:');
    try {
      // Create a test wallet (won't actually send transaction)
      const testWallet = ethers.Wallet.createRandom().connect(provider);
      const contractWithSigner = contract.connect(testWallet);

      const gasEstimate = await contractWithSigner.createJob.estimateGas(
        testDbId,
        USDC_AMOY,
        'polygon-amoy',
        true,
        false,
        false
      );

      console.log('  Estimated Gas:', gasEstimate.toString());

      const gasPrice = await provider.getFeeData();
      const estimatedCost = gasEstimate * gasPrice.gasPrice;
      console.log('  Estimated Cost:', ethers.formatEther(estimatedCost), 'MATIC');
    } catch (error) {
      console.log('  ❌ Gas estimation failed:', error.reason || error.message);
      console.log('\n  🔍 This error usually means:');
      console.log('     - The transaction would revert');
      console.log('     - Contract conditions not met');
      console.log('     - Or contract is paused');

      // Try to decode the error
      if (error.data) {
        console.log('\n  Error data:', error.data);
      }
    }

    console.log('\n✅ Contract diagnostics complete!');
    console.log('\n📝 Summary:');
    console.log('  - Contract is deployed and responding');
    console.log('  - USDC token is', isSupported ? 'supported' : 'NOT supported');
    console.log('  - Database ID is', isUsed ? 'already used' : 'available');

    console.log('\n💡 To fix MetaMask errors:');
    console.log('  1. Ensure wallet has MATIC for gas (get from faucet)');
    console.log('  2. Make sure wallet is on Polygon Amoy network');
    console.log('  3. Try with a fresh database ID');
    console.log('\n🚰 Get test MATIC from: https://faucet.polygon.technology/');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testContract();