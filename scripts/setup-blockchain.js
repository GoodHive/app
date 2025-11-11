#!/usr/bin/env node

/**
 * Blockchain Integration Setup Script
 * This script helps configure and verify the blockchain integration
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DEPLOYED_CONTRACT_ADDRESS = '0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5';

console.log('🚀 GoodHive Blockchain Integration Setup\n');
console.log(`✅ Deployed Contract Address: ${DEPLOYED_CONTRACT_ADDRESS}`);
console.log(`🔗 View on PolygonScan: https://amoy.polygonscan.com/address/${DEPLOYED_CONTRACT_ADDRESS}\n`);

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    console.log('📋 Let\'s configure your environment variables:\n');

    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    const envExamplePath = path.join(process.cwd(), '.env.example');

    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env.local file');
    } else if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
      console.log('📄 Copying from .env.example');
    } else {
      console.log('⚠️  No .env file found, creating new one');
    }

    // Get treasury address
    const treasuryAddress = await askQuestion('💰 Enter your treasury address (where fees will be sent): ');

    if (!treasuryAddress.startsWith('0x') || treasuryAddress.length !== 42) {
      console.log('❌ Invalid address format. Please use a valid Ethereum address.');
      process.exit(1);
    }

    // Get Thirdweb Client ID
    const thirdwebClientId = await askQuestion('🔑 Enter your Thirdweb Client ID (from thirdweb.com): ');

    if (!thirdwebClientId) {
      console.log('❌ Thirdweb Client ID is required. Get one from https://thirdweb.com');
      process.exit(1);
    }

    // Update or create environment variables
    const envVars = {
      'NEXT_PUBLIC_JOB_MANAGER_CONTRACT_ADDRESS': DEPLOYED_CONTRACT_ADDRESS,
      'NEXT_PUBLIC_TREASURY_ADDRESS': treasuryAddress,
      'NEXT_PUBLIC_THIRDWEB_CLIENT_ID': thirdwebClientId,
      'NEXT_PUBLIC_CHAIN_ID': '80002',
      'NEXT_PUBLIC_CHAIN_NAME': 'polygon-amoy',
      'NEXT_PUBLIC_BLOCK_EXPLORER': 'https://amoy.polygonscan.com/',
      'POLYGON_AMOY_RPC_URL': 'https://rpc-amoy.polygon.technology/'
    };

    // Update environment content
    Object.entries(envVars).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;

      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    });

    // Write updated .env.local file
    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log('\n✅ Configuration completed successfully!\n');

    // Display next steps
    console.log('📝 Next Steps:');
    console.log('1. Restart your development server:');
    console.log('   pnpm dev\n');

    console.log('2. Run the database migration:');
    console.log('   psql $DATABASE_URL -f database/migrations/add_blockchain_fields.sql\n');

    console.log('3. Get test tokens for testing:');
    console.log('   • MATIC: https://faucet.polygon.technology/');
    console.log('   • Test USDC: Use Polygon faucet or bridge');
    console.log('   • Test DAI: Use Polygon faucet or bridge\n');

    console.log('4. Test the integration:');
    console.log('   • Connect MetaMask to Polygon Amoy');
    console.log('   • Create a new job');
    console.log('   • Try publishing it on blockchain');
    console.log('   • Test fund management features\n');

    console.log('🎉 Your blockchain integration is ready to test!');
    console.log(`📱 Contract Address: ${DEPLOYED_CONTRACT_ADDRESS}`);
    console.log(`🏛️  Treasury Address: ${treasuryAddress}`);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

main();