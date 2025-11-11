"use client";

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'react-hot-toast';

import { useJobManager, useJobData } from '@/hooks/contracts/useJobManager';
import { getTokenInfo, getTokenBalance, formatTokenBalance } from '@/lib/contracts/erc20';
import { ACTIVE_CHAIN_ID } from '@/config/chains';
import type { DatabaseIdentifier } from '@/lib/contracts/jobManager';

interface FundManagerProps {
  jobId: DatabaseIdentifier;
  databaseJobId: number;
  tokenAddress: string;
  jobChainId?: number | null;
  jobChainLabel?: string;
  onClose: () => void;
}

export default function FundManager({
  jobId,
  databaseJobId,
  tokenAddress,
  jobChainId,
  jobChainLabel,
  onClose
}: FundManagerProps) {
  const account = useActiveAccount();
  const { addFunds, withdrawFunds, payFees, isLoading: isContractLoading } = useJobManager();
  const {
    jobData,
    balance: jobBalance,
    refetch: refetchJobData,
    error: jobDataError,
  } = useJobData(jobId);

  const [activeTab, setActiveTab] = useState<'add' | 'withdraw' | 'fees'>('add');
  const [amount, setAmount] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const friendlyChainName = jobChainLabel
    ? jobChainLabel
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'the correct network';

  // Load token info and user balance
  useEffect(() => {
    const loadData = async () => {
      if (!tokenAddress || !account) {
        setTokenInfo(null);
        return;
      }

      try {
        setIsLoading(true);
        const [info, balance] = await Promise.all([
          getTokenInfo(tokenAddress),
          getTokenBalance(tokenAddress, account.address)
        ]);

        setTokenInfo(info);
        setUserBalance(balance);
        setTokenError(null);
      } catch (error) {
        console.error('Failed to load token data:', error);
        toast.error('Failed to load token information');
        setTokenError('Token information unavailable for this job.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tokenAddress, account]);

  const handleAddFunds = async () => {
    if (!amount || !tokenInfo) return;

    const success = await addFunds(jobId, amount, tokenAddress);
    if (success) {
      setAmount('');
      refetchJobData();
      // Refresh user balance
      if (account) {
        const balance = await getTokenBalance(tokenAddress, account.address);
        setUserBalance(balance);
      }
    }
  };

  const handleWithdrawFunds = async (withdrawAll: boolean = false) => {
    if (!withdrawAll && !amount) return;

    const success = await withdrawFunds(jobId, withdrawAll ? '0' : amount, withdrawAll);
    if (success) {
      setAmount('');
      refetchJobData();
      // Refresh user balance
      if (account) {
        const balance = await getTokenBalance(tokenAddress, account.address);
        setUserBalance(balance);
      }
    }
  };

  const handlePayFees = async () => {
    if (!amount) return;

    const success = await payFees(jobId, amount);
    if (success) {
      setAmount('');
      refetchJobData();
    }
  };

  const getMaxAmount = () => {
    if (activeTab === 'add') {
      return tokenInfo ? formatTokenBalance(userBalance, tokenInfo.decimals) : '0';
    } else if (activeTab === 'withdraw') {
      return tokenInfo && jobBalance ? formatTokenBalance(jobBalance, tokenInfo.decimals) : '0';
    }
    return '0';
  };

  const setMaxAmount = () => {
    setAmount(getMaxAmount());
  };

  const chainMismatch = Boolean(
    jobChainId !== undefined &&
      jobChainId !== null &&
      jobChainId !== ACTIVE_CHAIN_ID,
  );

  const actionsDisabled =
    isContractLoading || isLoading || chainMismatch || Boolean(jobDataError);

  if (!account) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Wallet Required</h2>
            <p className="text-gray-600 mb-4">
              Please connect your wallet to manage job funds.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenAddress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Token not available</h2>
            <p className="text-gray-600 mb-4">
              We were unable to determine the payment token for this job. Please republish the job or contact support.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Fund Manager - Job #{databaseJobId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {(chainMismatch || tokenError || jobDataError) && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            {chainMismatch && (
              <p>
                This job is deployed on the {friendlyChainName} network. Please
                switch your wallet to that network to manage funds.
              </p>
            )}
            {tokenError && <p className="mt-2">{tokenError}</p>}
            {jobDataError && (
              <p className="mt-2">
                {jobDataError.includes('Job does not exist')
                  ? 'We could not find this job on the currently connected network. Confirm you are viewing the correct job ID and network before managing funds.'
                  : jobDataError}
              </p>
            )}
          </div>
        )}

        {/* Job Balance Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Job Balance</h3>
              <p className="text-sm text-gray-600">Available funds in the smart contract</p>
            </div>
            <div className="text-right">
              {tokenInfo && jobBalance ? (
                <p className="text-2xl font-bold text-green-600">
                  {formatTokenBalance(jobBalance, tokenInfo.decimals)} {tokenInfo.symbol}
                </p>
              ) : (
                <p className="text-gray-400">Loading...</p>
              )}
            </div>
          </div>
        </div>

        {/* User Balance Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Wallet Balance</h3>
              <p className="text-sm text-gray-600">Available in your wallet</p>
            </div>
            <div className="text-right">
              {tokenInfo ? (
                <p className="text-xl font-bold text-blue-600">
                  {formatTokenBalance(userBalance, tokenInfo.decimals)} {tokenInfo.symbol}
                </p>
              ) : (
                <p className="text-gray-400">Loading...</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'add', label: 'Add Funds', icon: '💰' },
            { id: 'withdraw', label: 'Withdraw', icon: '⬆️' },
            { id: 'fees', label: 'Pay Fees', icon: '💳' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount {tokenInfo ? `(${tokenInfo.symbol})` : ''}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.000001"
                min="0"
              />
              <button
                onClick={setMaxAmount}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: {getMaxAmount()} {tokenInfo?.symbol}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {activeTab === 'add' && (
              <>
                <button
                  onClick={handleAddFunds}
                  disabled={
                    actionsDisabled ||
                    !amount ||
                    parseFloat(amount) <= 0
                  }
                  className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isContractLoading ? 'Processing...' : 'Add Funds to Job'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Funds will be transferred from your wallet to the job contract
                </p>
              </>
            )}

            {activeTab === 'withdraw' && (
              <>
                <div className="space-y-2">
                  <button
                    onClick={() => handleWithdrawFunds(false)}
                    disabled={
                      actionsDisabled ||
                      !amount ||
                      parseFloat(amount) <= 0
                    }
                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isContractLoading ? 'Processing...' : 'Withdraw Amount'}
                  </button>

                  <button
                    onClick={() => handleWithdrawFunds(true)}
                    disabled={
                      actionsDisabled ||
                      !jobBalance ||
                      jobBalance === 0n
                    }
                    className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isContractLoading ? 'Processing...' : 'Withdraw All Funds'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Funds will be transferred back to your wallet
                </p>
              </>
            )}

            {activeTab === 'fees' && (
              <>
                <button
                  onClick={handlePayFees}
                  disabled={
                    actionsDisabled ||
                    !amount ||
                    parseFloat(amount) <= 0
                  }
                  className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isContractLoading ? 'Processing...' : 'Pay Service Fees'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Service fees will be calculated based on your job settings and paid to GoodHive
                </p>
              </>
            )}
          </div>

          {/* Service Fees Info */}
          {jobData && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Active Services & Fees</h4>
              <div className="space-y-1 text-sm">
                {jobData.talentService && (
                  <div className="flex justify-between">
                    <span>Talent Selection:</span>
                    <span className="font-medium text-green-600">10%</span>
                  </div>
                )}
                {jobData.recruiterService && (
                  <div className="flex justify-between">
                    <span>Recruiter Service:</span>
                    <span className="font-medium text-blue-600">8%</span>
                  </div>
                )}
                {jobData.mentorService && (
                  <div className="flex justify-between">
                    <span>Mentor Service:</span>
                    <span className="font-medium text-purple-600">12%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
