// Test script for Thirdweb authentication
// Run this in browser console or as a Node script to test the auth flow

const testWalletAddress = "0x742d35Cc6634C0532925a3b8D8DE0C0bfe8eCc9F";
const testEmail = "test@goodhive.io";

async function testThirdwebAuth() {
  console.log("🧪 Testing Thirdweb Authentication...");

  try {
    // Test 1: Login with wallet
    console.log("📝 Test 1: Authenticating with wallet...");
    const authResponse = await fetch("http://localhost:3001/api/auth/thirdweb-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress: testWalletAddress,
        email: testEmail,
      }),
    });

    const authData = await authResponse.json();
    console.log("✅ Auth Response:", authData);

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authData.error}`);
    }

    // Test 2: Check /api/auth/me
    console.log("📝 Test 2: Checking user data...");
    const meResponse = await fetch("http://localhost:3001/api/auth/me");
    const meData = await meResponse.json();
    console.log("✅ Me Response:", meData);

    if (!meResponse.ok) {
      throw new Error(`Me endpoint failed: ${meData.error}`);
    }

    // Test 3: Verify data consistency
    console.log("📝 Test 3: Verifying data consistency...");
    const isConsistent = 
      authData.user.user_id === meData.user_id &&
      authData.user.wallet_address?.toLowerCase() === testWalletAddress.toLowerCase();

    if (isConsistent) {
      console.log("✅ Data consistency check passed!");
    } else {
      console.error("❌ Data consistency check failed!");
      console.log("Auth data:", authData.user);
      console.log("Me data:", meData);
    }

    console.log("🎉 All tests passed! Thirdweb authentication is working.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Check if running in browser
if (typeof window !== "undefined") {
  console.log("🌐 Running in browser - you can call testThirdwebAuth() manually");
  window.testThirdwebAuth = testThirdwebAuth;
} else {
  // Run immediately if in Node.js
  testThirdwebAuth();
}

// Export for potential import
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testThirdwebAuth };
}