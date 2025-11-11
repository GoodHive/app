"use client";

import { useState } from 'react';
import { useActiveAccount, ConnectButton } from 'thirdweb/react';
import { useJobManager } from '@/hooks/contracts/useJobManager';
import { JOB_MANAGER_CONTRACT_ADDRESS } from '@/lib/contracts/jobManager';
import toast, { Toaster } from 'react-hot-toast';

export default function TestBlockchain() {
  const account = useActiveAccount();
  const { createJob, isLoading, error, isContractConfigured } = useJobManager();
  const [testStatus, setTestStatus] = useState<string>('');
  const [jobId, setJobId] = useState<number | null>(null);

  const runTest = async () => {
    if (!account) {
      setTestStatus('❌ Please connect your wallet first');
      return;
    }

    setTestStatus('🔄 Testing blockchain integration...');

    try {
      // Generate random database ID to avoid conflicts
      const testDatabaseId = Math.floor(Math.random() * 1000000) + 100000;

      console.log('Test Configuration:', {
        account: account.address,
        contract: JOB_MANAGER_CONTRACT_ADDRESS,
        databaseId: testDatabaseId,
        token: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // USDC_AMOY
      });

      setTestStatus(`📝 Creating job with ID ${testDatabaseId}...`);

      const result = await createJob({
        databaseId: testDatabaseId,
        tokenAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // USDC_AMOY
        chain: 'polygon-amoy',
        talentService: true,
        recruiterService: false,
        mentorService: false,
      });

      if (result) {
        setJobId(result);
        setTestStatus(`✅ Success! Job created with blockchain ID: ${result}`);
        toast.success(`Job ${result} created successfully!`);
      } else {
        setTestStatus('❌ Job creation failed - no ID returned');
      }
    } catch (err: any) {
      console.error('Test failed:', err);

      let errorMsg = err.message || 'Unknown error';

      // Parse common errors
      if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'You need MATIC for gas fees. Get from faucet: https://faucet.polygon.technology/';
      } else if (errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction was cancelled';
      } else if (errorMsg.includes('Database ID already')) {
        errorMsg = 'Database ID already exists. Try again.';
      }

      setTestStatus(`❌ Error: ${errorMsg}`);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Blockchain Integration Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span>Wallet:</span>
              <span className="font-mono text-sm">
                {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not connected'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Contract:</span>
              <span className="font-mono text-sm">
                {JOB_MANAGER_CONTRACT_ADDRESS ?
                  `${JOB_MANAGER_CONTRACT_ADDRESS.slice(0, 6)}...${JOB_MANAGER_CONTRACT_ADDRESS.slice(-4)}` :
                  'Not configured'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Network:</span>
              <span>Polygon Amoy Testnet</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className={isContractConfigured ? 'text-green-600' : 'text-red-600'}>
                {isContractConfigured ? '✅ Ready' : '❌ Not Ready'}
              </span>
            </div>
          </div>

          {!account && (
            <div className="mb-6">
              <ConnectButton />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Job Creation</h2>

          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              This will create a test job on the blockchain with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-4">
              <li>Random database ID (to avoid conflicts)</li>
              <li>USDC as payment token</li>
              <li>Talent service enabled</li>
              <li>Polygon Amoy testnet</li>
            </ul>
          </div>

          <button
            onClick={runTest}
            disabled={!account || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              !account || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? '⏳ Processing...' : '🚀 Run Test'}
          </button>

          {testStatus && (
            <div className={`mt-4 p-4 rounded-lg ${
              testStatus.includes('✅') ? 'bg-green-50 text-green-800' :
              testStatus.includes('❌') ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {testStatus}
            </div>
          )}

          {jobId && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Job Created Successfully!</h3>
              <p className="text-sm text-green-700">Blockchain Job ID: {jobId}</p>
              <a
                href={`https://amoy.polygonscan.com/address/${JOB_MANAGER_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                View on PolygonScan →
              </a>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Need Test MATIC?</h2>
          <p className="text-gray-600 mb-4">
            Get free test MATIC for Polygon Amoy from the official faucet:
          </p>
          <a
            href="https://faucet.polygon.technology/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🚰 Go to Faucet
          </a>
        </div>
      </div>
    </div>
  );
}