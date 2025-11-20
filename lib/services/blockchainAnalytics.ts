import {
  getJob,
  getJobBalance,
  getUserJobs,
  DatabaseIdentifier
} from '@/lib/contracts/jobManager';
import {
  getTokenInfo,
  formatTokenBalance
} from '@/lib/contracts/erc20';

export interface BlockchainJobData {
  jobId: string;
  databaseId: string;
  balance: string;
  balanceUSD: number;
  tokenAddress: string;
  tokenSymbol: string;
  isActive: boolean;
}

export interface BlockchainAnalytics {
  totalJobs: number;
  totalBalance: number;
  totalBalanceFormatted: string;
  averageBalance: number;
  activeJobs: number;
  jobs: BlockchainJobData[];
  lastUpdated: Date;
}

/**
 * Fetches comprehensive analytics data directly from blockchain
 */
export async function getBlockchainAnalytics(walletAddress: string): Promise<BlockchainAnalytics> {
  try {
    // Get all user's jobs from blockchain
    const jobIds = await getUserJobs(walletAddress);

    const jobs: BlockchainJobData[] = [];
    let totalBalance = 0;

    // Fetch detailed data for each job
    for (const jobId of jobIds) {
      try {
        const [jobData, jobBalance] = await Promise.all([
          getJob(Number(jobId)),
          getJobBalance(Number(jobId))
        ]);

        if (!jobData) continue;

        // Get token information for proper formatting
        const tokenInfo = await getTokenInfo(jobData.tokenAddress);
        const balanceBigInt = typeof jobBalance === 'bigint' ? jobBalance : BigInt(jobBalance);
        const formattedBalance = formatTokenBalance(balanceBigInt, tokenInfo.decimals);

        // Convert to USD (simplified - in real implementation, you'd use price oracles)
        // For now, assuming USDC/DAI = 1 USD, other tokens = 0 (placeholder)
        let balanceUSD = 0;
        if (tokenInfo.symbol === 'USDC' || tokenInfo.symbol === 'DAI') {
          balanceUSD = parseFloat(formattedBalance);
        }

        const blockchainJob: BlockchainJobData = {
          jobId: jobId.toString(),
          databaseId: jobData.databaseId.toString(),
          balance: formattedBalance,
          balanceUSD,
          tokenAddress: jobData.tokenAddress,
          tokenSymbol: tokenInfo.symbol,
          isActive: balanceBigInt > 0n
        };

        jobs.push(blockchainJob);
        totalBalance += balanceUSD;
      } catch (error) {
        console.warn(`Failed to fetch data for job ${jobId}:`, error);
        // Continue with other jobs even if one fails
      }
    }

    const activeJobs = jobs.filter(job => job.isActive).length;
    const averageBalance = jobs.length > 0 ? totalBalance / jobs.length : 0;

    return {
      totalJobs: jobs.length,
      totalBalance,
      totalBalanceFormatted: `$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      averageBalance,
      activeJobs,
      jobs,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Failed to fetch blockchain analytics:', error);
    throw new Error('Failed to fetch blockchain analytics');
  }
}

/**
 * Fetches blockchain balance for a specific job
 */
export async function getJobBlockchainBalance(jobId: DatabaseIdentifier): Promise<{
  balance: string;
  balanceUSD: number;
  tokenSymbol: string;
} | null> {
  try {
    const [jobData, jobBalance] = await Promise.all([
      getJob(jobId),
      getJobBalance(jobId)
    ]);

    if (!jobData) return null;

    const tokenInfo = await getTokenInfo(jobData.tokenAddress);
    const balanceBigInt = typeof jobBalance === 'bigint' ? jobBalance : BigInt(jobBalance);
    const formattedBalance = formatTokenBalance(balanceBigInt, tokenInfo.decimals);

    // Convert to USD (simplified)
    let balanceUSD = 0;
    if (tokenInfo.symbol === 'USDC' || tokenInfo.symbol === 'DAI') {
      balanceUSD = parseFloat(formattedBalance);
    }

    return {
      balance: formattedBalance,
      balanceUSD,
      tokenSymbol: tokenInfo.symbol
    };
  } catch (error) {
    console.error(`Failed to fetch blockchain balance for job ${jobId}:`, error);
    return null;
  }
}

/**
 * Reconciles database data with blockchain data
 */
export interface DataReconciliation {
  databaseTotal: number;
  blockchainTotal: number;
  discrepancy: number;
  discrepancyPercentage: number;
  jobsWithDiscrepancies: Array<{
    jobId: string;
    databaseBudget: number;
    blockchainBalance: number;
    difference: number;
  }>;
}

export async function reconcileData(
  databaseJobs: Array<{ id: string; budget: number; block_id?: string }>,
  walletAddress: string
): Promise<DataReconciliation> {
  try {
    const blockchainAnalytics = await getBlockchainAnalytics(walletAddress);

    const databaseTotal = databaseJobs.reduce((sum, job) => sum + job.budget, 0);
    const blockchainTotal = blockchainAnalytics.totalBalance;
    const discrepancy = Math.abs(databaseTotal - blockchainTotal);
    const discrepancyPercentage = databaseTotal > 0 ? (discrepancy / databaseTotal) * 100 : 0;

    const jobsWithDiscrepancies: DataReconciliation['jobsWithDiscrepancies'] = [];

    // Compare individual jobs
    for (const dbJob of databaseJobs) {
      if (!dbJob.block_id) continue; // Skip draft jobs

      const blockchainJob = blockchainAnalytics.jobs.find(
        job => job.databaseId === dbJob.id
      );

      if (blockchainJob) {
        const difference = Math.abs(dbJob.budget - blockchainJob.balanceUSD);
        if (difference > 0.01) { // More than 1 cent difference
          jobsWithDiscrepancies.push({
            jobId: dbJob.id,
            databaseBudget: dbJob.budget,
            blockchainBalance: blockchainJob.balanceUSD,
            difference
          });
        }
      }
    }

    return {
      databaseTotal,
      blockchainTotal,
      discrepancy,
      discrepancyPercentage,
      jobsWithDiscrepancies
    };
  } catch (error) {
    console.error('Failed to reconcile data:', error);
    throw new Error('Failed to reconcile database and blockchain data');
  }
}