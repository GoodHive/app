import { getContract, prepareContractCall, readContract } from "thirdweb";
import { thirdwebClient } from "../../clients/thirdwebClient";
import { activeChain } from "../../config/chains";

// Standard ERC20 ABI
export const ERC20_ABI = [
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string", "internalType": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{"name": "", "type": "string", "internalType": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8", "internalType": "uint8"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {"name": "owner", "type": "address", "internalType": "address"},
      {"name": "spender", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address", "internalType": "address"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      {"name": "from", "type": "address", "internalType": "address"},
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {"name": "from", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "to", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "value", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      {"name": "owner", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "spender", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "value", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
] as const;

// Token information interface
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}

// Common token addresses and info
export const TOKEN_INFO: Record<string, TokenInfo> = {
  // Polygon Amoy Testnet
  "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582": {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
  },
  "0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253": {
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    address: "0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253"
  },

  // Polygon Mainnet
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
  },
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": {
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
  }
};

// Get ERC20 contract instance
export function getERC20Contract(tokenAddress: string) {
  return getContract({
    client: thirdwebClient,
    chain: activeChain,
    address: tokenAddress,
    abi: ERC20_ABI,
  });
}

// Read functions
export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
  // Check if we have cached info
  if (TOKEN_INFO[tokenAddress]) {
    return TOKEN_INFO[tokenAddress];
  }

  // Fetch from contract
  const contract = getERC20Contract(tokenAddress);

  try {
    const [name, symbol, decimals] = await Promise.all([
      readContract({ contract, method: "name", params: [] }),
      readContract({ contract, method: "symbol", params: [] }),
      readContract({ contract, method: "decimals", params: [] })
    ]);

    const tokenInfo: TokenInfo = {
      name,
      symbol,
      decimals,
      address: tokenAddress
    };

    // Cache the result
    TOKEN_INFO[tokenAddress] = tokenInfo;

    return tokenInfo;
  } catch (error) {
    console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
    throw new Error(`Failed to fetch token information`);
  }
}

export async function getTokenBalance(tokenAddress: string, userAddress: string): Promise<bigint> {
  const contract = getERC20Contract(tokenAddress);
  return await readContract({
    contract,
    method: "balanceOf",
    params: [userAddress],
  });
}

export async function getTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  const contract = getERC20Contract(tokenAddress);
  return await readContract({
    contract,
    method: "allowance",
    params: [ownerAddress, spenderAddress],
  });
}

export async function getTotalSupply(tokenAddress: string): Promise<bigint> {
  const contract = getERC20Contract(tokenAddress);
  return await readContract({
    contract,
    method: "totalSupply",
    params: [],
  });
}

// Write function preparations
export function prepareApproveCall(tokenAddress: string, spenderAddress: string, amount: bigint) {
  const contract = getERC20Contract(tokenAddress);
  return prepareContractCall({
    contract,
    method: "approve",
    params: [spenderAddress, amount],
  });
}

export function prepareTransferCall(tokenAddress: string, toAddress: string, amount: bigint) {
  const contract = getERC20Contract(tokenAddress);
  return prepareContractCall({
    contract,
    method: "transfer",
    params: [toAddress, amount],
  });
}

// Helper functions
export function formatTokenBalance(
  balance: bigint,
  decimals: number,
  maxDecimals: number = 4
): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const remainder = balance % divisor;

  if (remainder === 0n) {
    return whole.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.slice(0, maxDecimals).replace(/0+$/, '');

  if (trimmed === '') {
    return whole.toString();
  }

  return `${whole}.${trimmed}`;
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount || amount === '0') return 0n;

  const [whole, decimal] = amount.split('.');
  const wholeWei = BigInt(whole || '0') * BigInt(10 ** decimals);

  if (!decimal) {
    return wholeWei;
  }

  const decimalPadded = decimal.padEnd(decimals, '0').slice(0, decimals);
  const decimalWei = BigInt(decimalPadded);

  return wholeWei + decimalWei;
}

// Check if user has sufficient balance and allowance
export async function checkTokenPermissions(
  tokenAddress: string,
  userAddress: string,
  spenderAddress: string,
  requiredAmount: bigint
): Promise<{
  hasBalance: boolean;
  hasAllowance: boolean;
  balance: bigint;
  allowance: bigint;
  needsApproval: boolean;
}> {
  const [balance, allowance] = await Promise.all([
    getTokenBalance(tokenAddress, userAddress),
    getTokenAllowance(tokenAddress, userAddress, spenderAddress)
  ]);

  const hasBalance = balance >= requiredAmount;
  const hasAllowance = allowance >= requiredAmount;

  return {
    hasBalance,
    hasAllowance,
    balance,
    allowance,
    needsApproval: hasBalance && !hasAllowance
  };
}

// Get formatted display string for token amount
export async function getFormattedTokenAmount(
  tokenAddress: string,
  amount: bigint
): Promise<string> {
  try {
    const tokenInfo = await getTokenInfo(tokenAddress);
    const formatted = formatTokenBalance(amount, tokenInfo.decimals);
    return `${formatted} ${tokenInfo.symbol}`;
  } catch (error) {
    console.error('Failed to format token amount:', error);
    return amount.toString();
  }
}

// Maximum uint256 value for unlimited approval
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

// Helper to prepare unlimited approval
export function prepareUnlimitedApprovalCall(tokenAddress: string, spenderAddress: string) {
  return prepareApproveCall(tokenAddress, spenderAddress, MAX_UINT256);
}