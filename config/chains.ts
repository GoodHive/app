// Chain configuration for Thirdweb
import { defineChain } from "thirdweb";

// Get chain configuration from environment variables
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "80002");
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || "polygon-amoy";
const blockExplorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://amoy.polygonscan.com/";
const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/";

// Define the chain dynamically based on environment variables
export const activeChain = defineChain({
  id: chainId,
  name: chainName,
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpc: rpcUrl,
  blockExplorers: [
    {
      name: "PolygonScan",
      url: blockExplorer,
    },
  ],
  testnet: chainName.includes("amoy") || chainName.includes("testnet") ? true : undefined,
  // Add custom gas configuration to avoid CORS issues
  gasPrice: {
    maxFeePerGas: 35000000000n, // 35 gwei
    maxPriorityFeePerGas: 35000000000n, // 35 gwei
  },
});

// Export chain ID for use in other parts of the app
export const ACTIVE_CHAIN_ID = chainId;