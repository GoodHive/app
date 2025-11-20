import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import {
  getBlockchainAnalytics,
  reconcileData,
  BlockchainAnalytics,
  DataReconciliation
} from '@/lib/services/blockchainAnalytics';

export interface UseBlockchainAnalyticsReturn {
  blockchainData: BlockchainAnalytics | null;
  reconciliation: DataReconciliation | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for fetching and managing blockchain analytics data
 */
export function useBlockchainAnalytics(
  databaseJobs?: Array<{ id: string; budget: number; block_id?: string }>
): UseBlockchainAnalyticsReturn {
  const account = useActiveAccount();
  const [blockchainData, setBlockchainData] = useState<BlockchainAnalytics | null>(null);
  const [reconciliation, setReconciliation] = useState<DataReconciliation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!account?.address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch blockchain analytics
      const analytics = await getBlockchainAnalytics(account.address);
      setBlockchainData(analytics);

      // If database jobs are provided, perform reconciliation
      if (databaseJobs && databaseJobs.length > 0) {
        const reconciliationResult = await reconcileData(databaseJobs, account.address);
        setReconciliation(reconciliationResult);
      }
    } catch (err: any) {
      console.error('Failed to fetch blockchain analytics:', err);
      setError(err.message || 'Failed to fetch blockchain data');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, databaseJobs]);

  // Auto-fetch data when account changes
  useEffect(() => {
    if (account?.address) {
      fetchData();
    } else {
      setBlockchainData(null);
      setReconciliation(null);
    }
  }, [fetchData, account?.address]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    blockchainData,
    reconciliation,
    isLoading,
    error,
    refetch: fetchData,
    clearError
  };
}

/**
 * Hook for periodic blockchain data updates
 */
export function useBlockchainAnalyticsWithRefresh(
  refreshInterval: number = 30000, // 30 seconds default
  databaseJobs?: Array<{ id: string; budget: number; block_id?: string }>
): UseBlockchainAnalyticsReturn & { isRefreshing: boolean } {
  const analytics = useBlockchainAnalytics(databaseJobs);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!analytics.isLoading && !analytics.error) {
        setIsRefreshing(true);
        try {
          await analytics.refetch();
        } finally {
          setIsRefreshing(false);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [analytics.refetch, analytics.isLoading, analytics.error, refreshInterval]);

  return {
    ...analytics,
    isRefreshing
  };
}