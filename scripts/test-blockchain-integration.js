#!/usr/bin/env node

/**
 * Test script for blockchain integration
 * This script tests the flow without needing the UI
 */

console.log('🧪 Testing Blockchain Integration\n');

async function testFlow() {
  try {
    // 1. Test API endpoint
    console.log('📡 Testing API endpoint...');
    const apiResponse = await fetch('http://localhost:3001/api/companies/my-profile?userId=550e8400-e29b-41d4-a716-446655440000');

    if (!apiResponse.ok) {
      throw new Error(`API failed: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const companyData = await apiResponse.json();
    console.log('✅ API Response:', companyData.headline);
    console.log('   User ID:', companyData.user_id);
    console.log('   Wallet:', companyData.wallet_address);
    console.log('   Approved:', companyData.approved);

    // 2. Test job creation endpoint
    console.log('\n📝 Testing job creation API...');
    const jobData = {
      title: "Test Blockchain Job",
      description: "Testing blockchain integration",
      location: "Remote",
      salary: "5000",
      experience: "2-5 years",
      type: "Full Time",
      skills: ["Blockchain", "React"],
      user_id: "550e8400-e29b-41d4-a716-446655440000"
    };

    const jobResponse = await fetch('http://localhost:3001/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    });

    const jobResult = await jobResponse.json();
    console.log('📋 Job Creation Response:', jobResponse.status, jobResult);

    // 3. Test contract configuration
    console.log('\n⛓️  Contract Configuration:');
    console.log('   Contract Address: 0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5');
    console.log('   Network: Polygon Amoy (testnet)');
    console.log('   USDC Address: 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582');

    console.log('\n✅ Integration test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Visit http://localhost:3001/companies/create-job');
    console.log('2. Click "Set Test User" in debug panel');
    console.log('3. Connect your wallet (use wallet address: 0xed948545Ec9e86678979e05cbafc39ef92BBda80)');
    console.log('4. Fill out job form and click "Publish On Blockchain"');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFlow();