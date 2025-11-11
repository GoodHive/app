#!/usr/bin/env node

/**
 * Comprehensive Integration Test Script
 * Tests all blockchain functionality with your deployed contract
 */

const { createPublicClient, http } = require('viem');
const { polygonAmoy } = require('viem/chains');
const fs = require('fs');
const path = require('path');

const CONTRACT_ADDRESS = '0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5';
const RPC_URL = 'https://rpc-amoy.polygon.technology/';

// Create a public client for reading from the blockchain
const client = createPublicClient({
  chain: polygonAmoy,
  transport: http(RPC_URL)
});

// Full contract ABI for testing
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
    "name": "paused",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool"}],
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
    "name": "TALENT_FEE",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "RECRUITER_FEE",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MENTOR_FEE",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
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
    "name": "isDatabaseIdUsed",
    "inputs": [{"name": "databaseId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContractStats",
    "inputs": [],
    "outputs": [
      {"name": "totalJobs_", "type": "uint256"},
      {"name": "activeJobs_", "type": "uint256"}
    ],
    "stateMutability": "view"
  }
];

// ERC20 ABI for token checks
const ERC20_ABI = [
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  }
];

async function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);

  if (!envExists) {
    console.log('❌ .env.local file not found');
    console.log('💡 Run: node scripts/setup-blockchain.js\n');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {
    'NEXT_PUBLIC_JOB_MANAGER_CONTRACT_ADDRESS': CONTRACT_ADDRESS,
    'NEXT_PUBLIC_THIRDWEB_CLIENT_ID': null,
    'NEXT_PUBLIC_TREASURY_ADDRESS': null,
    'NEXT_PUBLIC_CHAIN_ID': '80002',
    'NEXT_PUBLIC_CHAIN_NAME': 'polygon-amoy'
  };

  let allConfigured = true;

  Object.entries(envVars).forEach(([key, expectedValue]) => {
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = envContent.match(regex);

    if (match) {
      const value = match[1];
      if (expectedValue && value !== expectedValue) {
        console.log(`⚠️  ${key}: ${value} (expected: ${expectedValue})`);
        allConfigured = false;
      } else if (!expectedValue && !value) {
        console.log(`❌ ${key}: Not configured`);
        allConfigured = false;
      } else {
        console.log(`✅ ${key}: ${value}`);
      }
    } else {
      console.log(`❌ ${key}: Missing`);
      allConfigured = false;
    }
  });

  console.log();
  return allConfigured;
}

async function testContractBasics() {
  console.log('📄 Testing Contract Basics...\n');

  try {
    // Test basic contract info
    const [owner, treasury, totalJobs, activeJobs, paused] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'owner'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'treasury'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalJobs'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'activeJobs'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'paused'
      })
    ]);

    console.log(`✅ Contract Owner: ${owner}`);
    console.log(`✅ Treasury Address: ${treasury}`);
    console.log(`✅ Total Jobs: ${totalJobs.toString()}`);
    console.log(`✅ Active Jobs: ${activeJobs.toString()}`);
    console.log(`✅ Contract Paused: ${paused}`);

    return true;
  } catch (error) {
    console.log(`❌ Contract basics test failed: ${error.message}`);
    return false;
  }
}

async function testFeeStructure() {
  console.log('\n💰 Testing Fee Structure...\n');

  try {
    const [talentFee, recruiterFee, mentorFee] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'TALENT_FEE'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'RECRUITER_FEE'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'MENTOR_FEE'
      })
    ]);

    console.log(`✅ Talent Fee: ${(Number(talentFee) / 100).toFixed(2)}% (${talentFee.toString()} basis points)`);
    console.log(`✅ Recruiter Fee: ${(Number(recruiterFee) / 100).toFixed(2)}% (${recruiterFee.toString()} basis points)`);
    console.log(`✅ Mentor Fee: ${(Number(mentorFee) / 100).toFixed(2)}% (${mentorFee.toString()} basis points)`);

    // Verify expected values
    if (talentFee.toString() !== '1000' || recruiterFee.toString() !== '800' || mentorFee.toString() !== '1200') {
      console.log('⚠️  Fee structure doesn\'t match expected values');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`❌ Fee structure test failed: ${error.message}`);
    return false;
  }
}

async function testTokenSupport() {
  console.log('\n🪙  Testing Token Support...\n');

  try {
    const [usdcAddress, daiAddress] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'USDC_AMOY'
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'DAI_AMOY'
      })
    ]);

    console.log(`✅ USDC Address: ${usdcAddress}`);
    console.log(`✅ DAI Address: ${daiAddress}`);

    // Test token support function
    const [isUsdcSupported, isDaiSupported, isInvalidSupported] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'isSupportedToken',
        args: [usdcAddress]
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'isSupportedToken',
        args: [daiAddress]
      }),
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'isSupportedToken',
        args: ['0x0000000000000000000000000000000000000000']
      })
    ]);

    console.log(`✅ USDC Support: ${isUsdcSupported}`);
    console.log(`✅ DAI Support: ${isDaiSupported}`);
    console.log(`✅ Invalid Token Support: ${isInvalidSupported}`);

    // Test actual token contracts
    try {
      const usdcInfo = await Promise.all([
        client.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'name'
        }),
        client.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        client.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })
      ]);

      console.log(`✅ USDC Token: ${usdcInfo[0]} (${usdcInfo[1]}) - ${usdcInfo[2]} decimals`);
    } catch (error) {
      console.log(`⚠️  USDC token contract not accessible: ${error.message}`);
    }

    try {
      const daiInfo = await Promise.all([
        client.readContract({
          address: daiAddress,
          abi: ERC20_ABI,
          functionName: 'name'
        }),
        client.readContract({
          address: daiAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        client.readContract({
          address: daiAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })
      ]);

      console.log(`✅ DAI Token: ${daiInfo[0]} (${daiInfo[1]}) - ${daiInfo[2]} decimals`);
    } catch (error) {
      console.log(`⚠️  DAI token contract not accessible: ${error.message}`);
    }

    return isUsdcSupported && isDaiSupported && !isInvalidSupported;
  } catch (error) {
    console.log(`❌ Token support test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseIdTracking() {
  console.log('\n🗃️  Testing Database ID Tracking...\n');

  try {
    // Test with some sample database IDs
    const testIds = [1, 1000, 9999];

    for (const id of testIds) {
      const isUsed = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'isDatabaseIdUsed',
        args: [BigInt(id)]
      });

      console.log(`✅ Database ID ${id} used: ${isUsed}`);
    }

    return true;
  } catch (error) {
    console.log(`❌ Database ID tracking test failed: ${error.message}`);
    return false;
  }
}

async function testContractStats() {
  console.log('\n📊 Testing Contract Statistics...\n');

  try {
    const [totalJobs, activeJobs] = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getContractStats'
    });

    console.log(`✅ Contract Stats - Total: ${totalJobs.toString()}, Active: ${activeJobs.toString()}`);

    return true;
  } catch (error) {
    console.log(`❌ Contract stats test failed: ${error.message}`);
    return false;
  }
}

async function checkNetworkAndGas() {
  console.log('\n⛽ Checking Network and Gas...\n');

  try {
    const blockNumber = await client.getBlockNumber();
    console.log(`✅ Latest Block: ${blockNumber.toString()}`);

    const gasPrice = await client.getGasPrice();
    console.log(`✅ Gas Price: ${gasPrice.toString()} wei (${(Number(gasPrice) / 1e9).toFixed(2)} gwei)`);

    return true;
  } catch (error) {
    console.log(`❌ Network check failed: ${error.message}`);
    return false;
  }
}

async function checkApplicationIntegration() {
  console.log('\n🔗 Checking Application Integration...\n');

  // Check if required files exist
  const filesToCheck = [
    'lib/contracts/jobManager.ts',
    'lib/contracts/erc20.ts',
    'hooks/contracts/useJobManager.ts',
    'app/components/FundManager/FundManager.tsx',
    'app/api/blockchain/sync-job/route.ts',
    'app/api/blockchain/update-balance/route.ts',
    'database/migrations/add_blockchain_fields.sql'
  ];

  let allFilesExist = true;

  filesToCheck.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - Missing`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

async function runFullTest() {
  console.log('🧪 GoodHive Blockchain Integration Test Suite\n');
  console.log('='.repeat(60));
  console.log(`🏗️  Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Network: Polygon Amoy Testnet`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const tests = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Contract Basics', fn: testContractBasics },
    { name: 'Fee Structure', fn: testFeeStructure },
    { name: 'Token Support', fn: testTokenSupport },
    { name: 'Database ID Tracking', fn: testDatabaseIdTracking },
    { name: 'Contract Statistics', fn: testContractStats },
    { name: 'Network & Gas', fn: checkNetworkAndGas },
    { name: 'Application Integration', fn: checkApplicationIntegration }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed with error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your blockchain integration is ready!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Get test tokens from Polygon faucet');
    console.log('   2. Connect MetaMask to Polygon Amoy');
    console.log('   3. Test job creation in your app');
    console.log('   4. Test fund management features');
    console.log('   5. Monitor transactions on PolygonScan');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
    console.log('\n🔧 Common solutions:');
    console.log('   • Run: node scripts/setup-blockchain.js');
    console.log('   • Ensure .env.local is configured');
    console.log('   • Restart your development server');
    return false;
  }
}

// Run the test suite
runFullTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });