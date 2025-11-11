#!/usr/bin/env node

/**
 * API Testing Script
 * Tests the company profile API endpoint
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testAPI() {
  console.log('🧪 Testing Company Profile API\n');

  // Test different scenarios
  const tests = [
    {
      name: 'Missing userId parameter',
      url: 'http://localhost:3000/api/companies/my-profile'
    },
    {
      name: 'Invalid userId',
      url: 'http://localhost:3000/api/companies/my-profile?userId=invalid_user'
    },
    {
      name: 'Valid userId format',
      url: 'http://localhost:3000/api/companies/my-profile?userId=test_user_123'
    }
  ];

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`📡 URL: ${test.url}`);

    try {
      const response = await fetch(test.url);
      const data = await response.text();

      console.log(`📊 Status: ${response.status}`);
      console.log(`📝 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n🔧 Possible Solutions:');
  console.log('1. Check if database connection is working');
  console.log('2. Verify company data exists in database');
  console.log('3. Check if user_id cookie is being set correctly');
  console.log('4. Create a test company profile in database');

  rl.close();
}

testAPI();