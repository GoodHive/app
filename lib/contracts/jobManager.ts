import { getContract, prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { thirdwebClient } from "../../clients/thirdwebClient";
import { activeChain } from "../../config/chains";

// Contract ABI - will be updated once you provide the deployed contract address
export const JOB_MANAGER_ABI = [
  // Constructor
  {
    "type": "constructor",
    "inputs": [
      {"name": "_treasury", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "nonpayable"
  },

  // Events
  {
    "type": "event",
    "name": "JobCreated",
    "inputs": [
      {"type": "uint256", "name": "jobId", "indexed": true, "internalType": "uint256"},
      {"type": "uint256", "name": "databaseId", "indexed": true, "internalType": "uint256"},
      {"type": "address", "name": "owner", "indexed": true, "internalType": "address"},
      {"type": "address", "name": "tokenAddress", "indexed": false, "internalType": "address"},
      {"type": "string", "name": "chain", "indexed": false, "internalType": "string"}
    ],
    "anonymous": false
  },

  {
    "type": "event",
    "name": "FundsAdded",
    "inputs": [
      {"type": "uint256", "name": "jobId", "indexed": true, "internalType": "uint256"},
      {"type": "uint256", "name": "databaseId", "indexed": true, "internalType": "uint256"},
      {"type": "address", "name": "user", "indexed": true, "internalType": "address"},
      {"type": "uint256", "name": "amount", "indexed": false, "internalType": "uint256"},
      {"type": "address", "name": "tokenAddress", "indexed": false, "internalType": "address"}
    ],
    "anonymous": false
  },

  {
    "type": "event",
    "name": "FundsWithdrawn",
    "inputs": [
      {"type": "uint256", "name": "jobId", "indexed": true, "internalType": "uint256"},
      {"type": "uint256", "name": "databaseId", "indexed": true, "internalType": "uint256"},
      {"type": "address", "name": "user", "indexed": true, "internalType": "address"},
      {"type": "uint256", "name": "amount", "indexed": false, "internalType": "uint256"},
      {"type": "address", "name": "tokenAddress", "indexed": false, "internalType": "address"}
    ],
    "anonymous": false
  },

  {
    "type": "event",
    "name": "FeePaid",
    "inputs": [
      {"type": "uint256", "name": "jobId", "indexed": true, "internalType": "uint256"},
      {"type": "uint256", "name": "databaseId", "indexed": true, "internalType": "uint256"},
      {"type": "address", "name": "user", "indexed": true, "internalType": "address"},
      {"type": "uint256", "name": "amount", "indexed": false, "internalType": "uint256"},
      {"type": "address", "name": "tokenAddress", "indexed": false, "internalType": "address"},
      {"type": "string", "name": "feeType", "indexed": false, "internalType": "string"}
    ],
    "anonymous": false
  },

  // View Functions
  {
    "type": "function",
    "name": "getJob",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct GoodHiveJobManager.Job",
        "components": [
          {"name": "owner", "type": "address", "internalType": "address"},
          {"name": "databaseId", "type": "uint256", "internalType": "uint256"},
          {"name": "totalBalance", "type": "uint256", "internalType": "uint256"},
          {"name": "tokenAddress", "type": "address", "internalType": "address"},
          {"name": "isApproved", "type": "bool", "internalType": "bool"},
          {"name": "isActive", "type": "bool", "internalType": "bool"},
          {"name": "createdAt", "type": "uint256", "internalType": "uint256"},
          {"name": "updatedAt", "type": "uint256", "internalType": "uint256"},
          {"name": "chain", "type": "string", "internalType": "string"},
          {"name": "talentService", "type": "bool", "internalType": "bool"},
          {"name": "recruiterService", "type": "bool", "internalType": "bool"},
          {"name": "mentorService", "type": "bool", "internalType": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },

  {
    "type": "function",
    "name": "getJobBalance",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },

  {
    "type": "function",
    "name": "getUserJobs",
    "inputs": [
      {"name": "user", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "", "type": "uint256[]", "internalType": "uint256[]"}
    ],
    "stateMutability": "view"
  },

  {
    "type": "function",
    "name": "calculateTotalFees",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"},
      {"name": "baseAmount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },

  {
    "type": "function",
    "name": "isDatabaseIdUsed",
    "inputs": [
      {"name": "databaseId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "view"
  },

  {
    "type": "function",
    "name": "isSupportedToken",
    "inputs": [
      {"name": "tokenAddress", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "pure"
  },

  {
    "type": "function",
    "name": "getContractStats",
    "inputs": [],
    "outputs": [
      {"name": "totalJobs_", "type": "uint256", "internalType": "uint256"},
      {"name": "activeJobs_", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },

  // Write Functions
  {
    "type": "function",
    "name": "createJob",
    "inputs": [
      {"name": "databaseId", "type": "uint256", "internalType": "uint256"},
      {"name": "tokenAddress", "type": "address", "internalType": "address"},
      {"name": "chain", "type": "string", "internalType": "string"},
      {"name": "talentService", "type": "bool", "internalType": "bool"},
      {"name": "recruiterService", "type": "bool", "internalType": "bool"},
      {"name": "mentorService", "type": "bool", "internalType": "bool"}
    ],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "nonpayable"
  },

  {
    "type": "function",
    "name": "addFunds",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  {
    "type": "function",
    "name": "withdrawFunds",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  {
    "type": "function",
    "name": "withdrawAllFunds",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  {
    "type": "function",
    "name": "payFees",
    "inputs": [
      {"name": "jobId", "type": "uint256", "internalType": "uint256"},
      {"name": "baseAmount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  // Constants
  {
    "type": "function",
    "name": "USDC_AMOY",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DAI_AMOY",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "USDC_MAINNET",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DAI_MAINNET",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  }
] as const;

// Contract configuration - deployed on Polygon Amoy
export const JOB_MANAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_JOB_MANAGER_CONTRACT_ADDRESS || "0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5";

// Token addresses
export const SUPPORTED_TOKENS = {
  // Polygon Amoy Testnet
  USDC_AMOY: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  DAI_AMOY: "0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253",

  // Polygon Mainnet
  USDC_MAINNET: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  DAI_MAINNET: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
} as const;

// Get contract instance
export function getJobManagerContract() {
  if (!JOB_MANAGER_CONTRACT_ADDRESS) {
    throw new Error("Job Manager contract address not configured");
  }

  return getContract({
    client: thirdwebClient,
    chain: activeChain,
    address: JOB_MANAGER_CONTRACT_ADDRESS,
    abi: JOB_MANAGER_ABI,
  });
}

// Job creation interface
export type DatabaseIdentifier = number | string | bigint;

export interface JobCreationParams {
  databaseId: DatabaseIdentifier;
  tokenAddress: string;
  chain: string;
  talentService: boolean;
  recruiterService: boolean;
  mentorService: boolean;
}

// Job data interface
export interface JobData {
  owner: string;
  databaseId: bigint;
  totalBalance: bigint;
  tokenAddress: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  chain: string;
  talentService: boolean;
  recruiterService: boolean;
  mentorService: boolean;
}

// Read functions
export async function getJob(jobId: DatabaseIdentifier): Promise<JobData> {
  const contract = getJobManagerContract();
  return await readContract({
    contract,
    method: "getJob",
    params: [normalizeDatabaseId(jobId)],
  });
}

export async function getJobBalance(jobId: DatabaseIdentifier): Promise<bigint> {
  const contract = getJobManagerContract();
  return await readContract({
    contract,
    method: "getJobBalance",
    params: [normalizeDatabaseId(jobId)],
  });
}

export async function getUserJobs(userAddress: string): Promise<bigint[]> {
  const contract = getJobManagerContract();
  return await readContract({
    contract,
    method: "getUserJobs",
    params: [userAddress],
  });
}

export async function calculateTotalFees(jobId: DatabaseIdentifier, baseAmount: bigint): Promise<bigint> {
  const contract = getJobManagerContract();
  return await readContract({
    contract,
    method: "calculateTotalFees",
    params: [normalizeDatabaseId(jobId), baseAmount],
  });
}

export function normalizeDatabaseId(databaseId: DatabaseIdentifier): bigint {
  if (typeof databaseId === "bigint") {
    return databaseId;
  }

  if (typeof databaseId === "number") {
    return BigInt(databaseId);
  }

  const trimmed = databaseId.trim();

  if (!trimmed) {
    throw new Error("Database ID cannot be empty");
  }

  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    return BigInt(trimmed);
  }

  if (/^\d+$/.test(trimmed)) {
    return BigInt(trimmed);
  }

  const hexValue = trimmed.replace(/-/g, "");

  if (/^[0-9a-fA-F]+$/.test(hexValue)) {
    return BigInt(`0x${hexValue}`);
  }

  throw new Error(`Unsupported database ID format: ${databaseId}`);
}

export async function isDatabaseIdUsed(databaseId: DatabaseIdentifier): Promise<boolean> {
  const contract = getJobManagerContract();
  return await readContract({
    contract,
    method: "isDatabaseIdUsed",
    params: [normalizeDatabaseId(databaseId)],
  });
}

export async function isSupportedToken(tokenAddress: string): Promise<boolean> {
  const contract = getJobManagerContract();
  return await readContract({
    contract,
    method: "isSupportedToken",
    params: [tokenAddress],
  });
}

export async function getContractStats(): Promise<{ totalJobs: bigint; activeJobs: bigint }> {
  const contract = getJobManagerContract();
  const [totalJobs, activeJobs] = await readContract({
    contract,
    method: "getContractStats",
    params: [],
  });
  return { totalJobs, activeJobs };
}

// Write functions - prepare calls for transactions
export function prepareCreateJobCall(params: JobCreationParams) {
  const contract = getJobManagerContract();
  return prepareContractCall({
    contract,
    method: "createJob",
    params: [
      normalizeDatabaseId(params.databaseId),
      params.tokenAddress,
      params.chain,
      params.talentService,
      params.recruiterService,
      params.mentorService,
    ],
    // Add gas overrides to avoid CORS issues with gas station API
    gas: 500000n,
    maxFeePerGas: 35000000000n, // 35 gwei
    maxPriorityFeePerGas: 35000000000n, // 35 gwei
  });
}

export function prepareAddFundsCall(jobId: DatabaseIdentifier, amount: bigint) {
  const contract = getJobManagerContract();
  return prepareContractCall({
    contract,
    method: "addFunds",
    params: [normalizeDatabaseId(jobId), amount],
    gas: 300000n,
    maxFeePerGas: 35000000000n,
    maxPriorityFeePerGas: 35000000000n,
  });
}

export function prepareWithdrawFundsCall(jobId: DatabaseIdentifier, amount: bigint) {
  const contract = getJobManagerContract();
  return prepareContractCall({
    contract,
    method: "withdrawFunds",
    params: [normalizeDatabaseId(jobId), amount],
    gas: 300000n,
    maxFeePerGas: 35000000000n,
    maxPriorityFeePerGas: 35000000000n,
  });
}

export function prepareWithdrawAllFundsCall(jobId: DatabaseIdentifier) {
  const contract = getJobManagerContract();
  return prepareContractCall({
    contract,
    method: "withdrawAllFunds",
    params: [normalizeDatabaseId(jobId)],
    gas: 300000n,
    maxFeePerGas: 35000000000n,
    maxPriorityFeePerGas: 35000000000n,
  });
}

export function preparePayFeesCall(jobId: DatabaseIdentifier, baseAmount: bigint) {
  const contract = getJobManagerContract();
  return prepareContractCall({
    contract,
    method: "payFees",
    params: [normalizeDatabaseId(jobId), baseAmount],
    gas: 400000n,
    maxFeePerGas: 35000000000n,
    maxPriorityFeePerGas: 35000000000n,
  });
}

// Helper function to get supported token for current chain
export function getSupportedTokensForChain(chainId: number) {
  if (chainId === 80002) { // Polygon Amoy
    return {
      USDC: SUPPORTED_TOKENS.USDC_AMOY,
      DAI: SUPPORTED_TOKENS.DAI_AMOY,
    };
  } else if (chainId === 137) { // Polygon Mainnet
    return {
      USDC: SUPPORTED_TOKENS.USDC_MAINNET,
      DAI: SUPPORTED_TOKENS.DAI_MAINNET,
    };
  }
  return {};
}

// Helper function to format token amount based on decimals
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === 0n) {
    return whole.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');

  if (trimmed === '') {
    return whole.toString();
  }

  return `${whole}.${trimmed}`;
}

// Helper function to parse token amount to wei
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [whole, decimal] = amount.split('.');
  const wholeWei = BigInt(whole || '0') * BigInt(10 ** decimals);

  if (!decimal) {
    return wholeWei;
  }

  const decimalPadded = decimal.padEnd(decimals, '0').slice(0, decimals);
  const decimalWei = BigInt(decimalPadded);

  return wholeWei + decimalWei;
}
