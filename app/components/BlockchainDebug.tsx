"use client";

import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useJobManager } from '@/hooks/contracts/useJobManager';
import { JOB_MANAGER_CONTRACT_ADDRESS } from '@/lib/contracts/jobManager';
import Cookies from 'js-cookie';

export default function BlockchainDebug() {
  const account = useActiveAccount();
  const { createJob, isLoading, error, isContractConfigured } = useJobManager();
  const [testResult, setTestResult] = useState<string>('');
  const [apiResult, setApiResult] = useState<string>('');

  const userId = Cookies.get('user_id');

  const handleTestAPI = async () => {
    setApiResult('Testing API...');

    try {
      // Use test user ID if no real user ID is available
      const testUserId = userId || '550e8400-e29b-41d4-a716-446655440000';
      const response = await fetch(`/api/companies/my-profile?userId=${testUserId}`);
      const data = await response.json();

      setApiResult(`Status: ${response.status} | Data: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      setApiResult(`API Error: ${err.message}`);
    }
  };

  const handleSetTestUser = () => {
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    const testUser = {
      user_id: testUserId,
      email: 'test@goodhive.com',
      wallet_address: '0xed948545Ec9e86678979e05cbafc39ef92BBda80',
      auth_method: 'wallet'
    };

    Cookies.set('user_id', testUserId);
    Cookies.set('loggedIn_user', JSON.stringify(testUser));

    window.location.reload();
  };

  const handleTest = async () => {
    setTestResult('Testing...');

    try {
      // Test basic blockchain integration
      console.log('=== BLOCKCHAIN DEBUG ===');
      console.log('Account:', account?.address);
      console.log('Contract Address:', JOB_MANAGER_CONTRACT_ADDRESS);
      console.log('Contract Configured:', isContractConfigured);
      console.log('Loading:', isLoading);
      console.log('Error:', error);

      if (!account) {
        setTestResult('❌ No wallet connected');
        return;
      }

      if (!isContractConfigured) {
        setTestResult('❌ Contract not configured');
        return;
      }

      // Check if database ID is already used (using a random ID to avoid conflicts)
      const testDatabaseId = Math.floor(Math.random() * 1000000) + 100000;
      console.log('Using test database ID:', testDatabaseId);

      // Try to create a test job with proper parameters
      const result = await createJob({
        databaseId: testDatabaseId,
        tokenAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // USDC_AMOY
        chain: 'polygon-amoy',
        talentService: true,
        recruiterService: false,
        mentorService: false,
      });

      if (result) {
        setTestResult(`✅ Test successful! Job ID: ${result}`);
      } else {
        setTestResult(`❌ Test failed - no result returned`);
      }

    } catch (err: any) {
      console.error('Test error:', err);
      // Parse the error for more details
      let errorMessage = err.message || 'Unknown error';

      if (errorMessage.includes('Database ID already used')) {
        errorMessage = 'Database ID already exists on blockchain. Try again.';
      } else if (errorMessage.includes('Token not supported')) {
        errorMessage = 'Token address not supported by contract';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient MATIC for gas fees';
      }

      setTestResult(`❌ Test failed: ${errorMessage}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 m-4">
      <h3 className="text-lg font-bold mb-4">🔧 Blockchain Debug Panel</h3>

      <div className="space-y-2 text-sm mb-4">
        <div>🆔 User ID: {userId || '❌ Not set'}</div>
        <div>👤 Wallet: {account?.address || '❌ Not connected'}</div>
        <div>📄 Contract: {JOB_MANAGER_CONTRACT_ADDRESS || '❌ Not configured'}</div>
        <div>🔧 Configured: {isContractConfigured ? '✅' : '❌'}</div>
        <div>⏳ Loading: {isLoading ? '✅' : '❌'}</div>
        <div>🚨 Error: {error || '✅ None'}</div>
      </div>

      <div className="space-x-2 mb-4">
        <button
          onClick={handleSetTestUser}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Set Test User
        </button>
        <button
          onClick={handleTestAPI}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test API
        </button>
        <button
          onClick={handleTest}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Testing...' : 'Test Blockchain'}
        </button>
      </div>

      {apiResult && (
        <div className="mt-4 p-3 bg-white border rounded">
          <strong>API Result:</strong> <pre className="text-xs mt-2">{apiResult}</pre>
        </div>
      )}

      {testResult && (
        <div className="mt-4 p-3 bg-white border rounded">
          <strong>Blockchain Result:</strong> {testResult}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Check browser console for detailed logs
      </div>
    </div>
  );
}