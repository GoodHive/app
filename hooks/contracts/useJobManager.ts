import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { parseEventLogs, sendTransaction, waitForReceipt } from 'thirdweb';
import toast from 'react-hot-toast';

import {
  getJob,
  getJobBalance,
  getUserJobs,
  calculateTotalFees,
  isDatabaseIdUsed,
  getContractStats,
  prepareCreateJobCall,
  prepareAddFundsCall,
  prepareWithdrawFundsCall,
  prepareWithdrawAllFundsCall,
  preparePayFeesCall,
  JobCreationParams,
  JobData,
  JOB_MANAGER_CONTRACT_ADDRESS,
  JOB_MANAGER_ABI,
  normalizeDatabaseId,
  DatabaseIdentifier
} from '@/lib/contracts/jobManager';

import {
  getTokenBalance,
  getTokenAllowance,
  checkTokenPermissions,
  prepareApproveCall,
  getTokenInfo,
  formatTokenBalance,
  parseTokenAmount
} from '@/lib/contracts/erc20';

import { thirdwebClient } from '@/clients/thirdwebClient';
import { activeChain } from '@/config/chains';

// Hook for managing job contract interactions
export function useJobManager() {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check if contract is configured
  const isContractConfigured = !!JOB_MANAGER_CONTRACT_ADDRESS;

  // Create a new job on the blockchain
  const createJob = useCallback(async (params: JobCreationParams): Promise<string | null> => {
    if (!account) {
      setError('Please connect your wallet');
      return null;
    }

    if (!isContractConfigured) {
      setError('Job contract not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if database ID is already used
      const normalizedDatabaseId = normalizeDatabaseId(params.databaseId);

      const isUsed = await isDatabaseIdUsed(normalizedDatabaseId);
      if (isUsed) {
        throw new Error('Database ID already exists on blockchain');
      }

      // Prepare the transaction (gas settings are now in prepareCreateJobCall)
      const transaction = prepareCreateJobCall(params);

      // Send transaction
      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      // Wait for confirmation
      const receipt = await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      let blockchainJobId: string | null = null;

      try {
        const events = parseEventLogs({
          abi: JOB_MANAGER_ABI,
          logs: receipt.logs,
          eventName: 'JobCreated'
        });

        console.debug('JobCreated events', events);

        const jobCreatedEvent = events.find((event) => {
          if (!event.args || !('databaseId' in event.args)) {
            return false;
          }

          const eventDatabaseId = event.args.databaseId as bigint | string | number | undefined;

          if (eventDatabaseId === undefined) {
            return false;
          }

          try {
            const normalizedEventDatabaseId =
              typeof eventDatabaseId === 'bigint'
                ? eventDatabaseId
                : BigInt(eventDatabaseId as any);

            return normalizedEventDatabaseId === normalizedDatabaseId;
          } catch {
            return false;
          }
        });

        if (jobCreatedEvent && jobCreatedEvent.args && 'jobId' in jobCreatedEvent.args) {
          const eventJobId = jobCreatedEvent.args.jobId as bigint | string | number;
          const normalizedEventJobId =
            typeof eventJobId === 'bigint'
              ? eventJobId
              : BigInt(eventJobId as any);

          blockchainJobId = normalizedEventJobId.toString();
        }
      } catch (parseError) {
        console.warn('Failed to parse JobCreated event logs:', parseError);
      }

      if (!blockchainJobId) {
        try {
          const userJobIds = await getUserJobs(account.address);
          let matched = false;

          for (const jobId of [...userJobIds].reverse()) {
            try {
              const jobData = await getJob(Number(jobId));
              if (!jobData) {
                return;
              }

              const jobDatabaseId =
                typeof jobData.databaseId === 'bigint'
                  ? jobData.databaseId
                  : BigInt(jobData.databaseId);

              if (jobDatabaseId === normalizedDatabaseId) {
                blockchainJobId = jobId.toString();
                matched = true;
                break;
              }
            } catch (innerError) {
              console.warn(
                `Failed to load job ${jobId.toString()} for fallback lookup`,
                innerError
              );
            }
          }

          if (!matched && userJobIds.length > 0) {
            blockchainJobId = userJobIds[userJobIds.length - 1].toString();
          }
        } catch (fallbackError) {
          console.warn('Failed to determine blockchain job ID via fallback', fallbackError);
        }
      }

      if (!blockchainJobId) {
        console.warn('Unable to determine blockchain job ID after successful transaction');
      }

      toast.success('Job created on blockchain!');

      return blockchainJobId;
    } catch (err: any) {
      console.error('Failed to create job:', err);
      const isRateLimited =
        (err?.code === -32603 || err?.code === 'RATE_LIMITED') &&
        typeof err?.message === 'string' &&
        err.message.toLowerCase().includes('rate limited');

      const errorMessage = isRateLimited
        ? 'RPC provider rate limit hit while broadcasting the transaction. Please switch MetaMask to a custom Polygon RPC (e.g. an Alchemy/Infura endpoint) and try again.'
        : err?.message || 'Failed to create job';

      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account, isContractConfigured]);

  // Add funds to a job
  const addFunds = useCallback(async (
    jobId: DatabaseIdentifier,
    amount: string,
    tokenAddress: string
  ): Promise<boolean> => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get token info
      const tokenInfo = await getTokenInfo(tokenAddress);
      const amountWei = parseTokenAmount(amount, tokenInfo.decimals);

      // Check token permissions
      const permissions = await checkTokenPermissions(
        tokenAddress,
        account.address,
        JOB_MANAGER_CONTRACT_ADDRESS,
        amountWei
      );

      if (!permissions.hasBalance) {
        throw new Error(`Insufficient ${tokenInfo.symbol} balance`);
      }

      // Approve if needed
      if (permissions.needsApproval) {
        toast.loading('Approving token spending...');

        const approvalTransaction = prepareApproveCall(
          tokenAddress,
          JOB_MANAGER_CONTRACT_ADDRESS,
          amountWei
        );

        const { transactionHash: approvalHash } = await sendTransaction({
          transaction: approvalTransaction,
          account
        });

        await waitForReceipt({
          client: thirdwebClient,
          chain: approvalTransaction.chain ?? activeChain,
          transactionHash: approvalHash
        });

        toast.dismiss();
        toast.success('Token spending approved!');
      }

      // Add funds
      const transaction = prepareAddFundsCall(jobId, amountWei);

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      toast.success('Funds added successfully!');
      return true;
    } catch (err: any) {
      console.error('Failed to add funds:', err);
      const errorMessage = err.message || 'Failed to add funds';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Withdraw funds from a job
  const withdrawFunds = useCallback(async (
    jobId: DatabaseIdentifier,
    amount: string,
    withdrawAll: boolean = false
  ): Promise<boolean> => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let transaction;

      if (withdrawAll) {
        transaction = prepareWithdrawAllFundsCall(jobId);
      } else {
        // For partial withdrawal, we need to get job info to determine token decimals
        const job = await getJob(jobId);
        const tokenInfo = await getTokenInfo(job.tokenAddress);
        const amountWei = parseTokenAmount(amount, tokenInfo.decimals);

        transaction = prepareWithdrawFundsCall(jobId, amountWei);
      }

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      toast.success(withdrawAll ? 'All funds withdrawn!' : 'Funds withdrawn successfully!');
      return true;
    } catch (err: any) {
      console.error('Failed to withdraw funds:', err);
      const errorMessage = err.message || 'Failed to withdraw funds';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Pay fees for a job
  const payFees = useCallback(async (
    jobId: DatabaseIdentifier,
    baseAmount: string
  ): Promise<boolean> => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get job info to determine token
      const job = await getJob(jobId);
      const tokenInfo = await getTokenInfo(job.tokenAddress);
      const baseAmountWei = parseTokenAmount(baseAmount, tokenInfo.decimals);

      // Calculate total fees
      const totalFees = await calculateTotalFees(jobId, baseAmountWei);

      // Check if job has sufficient balance
      const jobBalance = await getJobBalance(jobId);
      if (jobBalance < totalFees) {
        throw new Error('Insufficient balance in job to pay fees');
      }

      const transaction = preparePayFeesCall(jobId, baseAmountWei);

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      await waitForReceipt({
        client: thirdwebClient,
        chain: transaction.chain ?? activeChain,
        transactionHash
      });

      toast.success('Fees paid successfully!');
      return true;
    } catch (err: any) {
      console.error('Failed to pay fees:', err);
      const errorMessage = err.message || 'Failed to pay fees';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  return {
    // State
    isLoading,
    error,
    isContractConfigured,

    // Actions
    createJob,
    addFunds,
    withdrawFunds,
    payFees,

    // Utilities
    clearError: () => setError(null)
  };
}

// Hook for reading job data
export function useJobData(jobId: DatabaseIdentifier | null) {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobData = useCallback(async () => {
    if (jobId === null || jobId === undefined || jobId === "") {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [job, jobBalance] = await Promise.all([
        getJob(jobId),
        getJobBalance(jobId)
      ]);

      setJobData(job);

      // Convert balance from wei to token units
      // Ensure jobBalance is a bigint
      const balanceBigInt = typeof jobBalance === 'bigint' ? jobBalance : BigInt(jobBalance);

      if (job && job.tokenAddress) {
        const tokenInfo = await getTokenInfo(job.tokenAddress);
        const formattedBalance = formatTokenBalance(balanceBigInt, tokenInfo.decimals);
        setBalance(formattedBalance);
      } else {
        // Fallback: assume 6 decimals for USDC/DAI
        const formattedBalance = formatTokenBalance(balanceBigInt, 6);
        setBalance(formattedBalance);
      }
    } catch (err: any) {
      console.error('Failed to fetch job data:', err);
      setError(err.message || 'Failed to fetch job data');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  return {
    jobData,
    balance,
    isLoading,
    error,
    refetch: fetchJobData
  };
}

// Hook for user's jobs
export function useUserJobs() {
  const account = useActiveAccount();
  const [jobIds, setJobIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserJobs = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const jobs = await getUserJobs(account.address);
      setJobIds(jobs);
    } catch (err: any) {
      console.error('Failed to fetch user jobs:', err);
      setError(err.message || 'Failed to fetch user jobs');
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchUserJobs();
  }, [fetchUserJobs]);

  return {
    jobIds,
    isLoading,
    error,
    refetch: fetchUserJobs
  };
}

// Hook for contract statistics
export function useContractStats() {
  const [stats, setStats] = useState<{ totalJobs: bigint; activeJobs: bigint } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contractStats = await getContractStats();
      setStats(contractStats);
    } catch (err: any) {
      console.error('Failed to fetch contract stats:', err);
      setError(err.message || 'Failed to fetch contract stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}
