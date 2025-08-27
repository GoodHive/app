// lib/thirdweb/config.ts - Production-grade configuration
import { createThirdwebClient, defineChain } from "thirdweb";
import { polygon } from "thirdweb/chains";

// Define Polygon Amoy with correct configuration
export const polygonAmoy = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpc: "https://rpc-amoy.polygon.technology",
  testnet: true,
  blockExplorers: [
    {
      name: "PolygonScan",
      url: "https://amoy.polygonscan.com",
      apiUrl: "https://api-amoy.polygonscan.com/api",
    },
  ],
});

// Dynamic chain selection based on environment
export const getActiveChain = () => {
  return process.env.NODE_ENV === 'production' ? polygon : polygonAmoy;
};

// Client singleton pattern for performance
let clientInstance: ReturnType<typeof createThirdwebClient> | null = null;

export const getThirdwebClient = () => {
  if (!clientInstance) {
    // Validate environment when actually creating client
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    
    if (!clientId) {
      console.error('🐝 Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID environment variable');
      console.error('🐝 Available env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
      throw new Error("NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set");
    }

    clientInstance = createThirdwebClient({
      clientId,
      config: {
        storage: {
          // Use IndexedDB for better performance
          gatewayUrl: "https://gateway.ipfscdn.io/ipfs/",
        },
        rpc: {
          // Custom RPC for reliability
          [polygon.id]: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.public.blastapi.io",
          [polygonAmoy.id]: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
        },
      },
    });

    // Add client-side logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🐝 Thirdweb client initialized for GoodHive');
      console.log('🐝 Using client ID:', clientId);
    }
  }
  return clientInstance;
};

// Smart account configuration for gasless transactions
export const smartAccountConfig = {
  chain: getActiveChain(),
  sponsorGas: true,
  factoryAddress: "0x4651515A83ea12d4E5b48C27E7F5e9FF8D9a4FA3", // Thirdweb's default factory
  gasless: true,
};

// Supported chains configuration - Polygon only
export const supportedChains = [polygon, polygonAmoy];

// Feature flags for controlled rollout
export const FEATURES = {
  USE_THIRDWEB: process.env.NEXT_PUBLIC_USE_THIRDWEB === "true",
  ENABLE_SMART_ACCOUNTS: process.env.NEXT_PUBLIC_SMART_ACCOUNTS === "true",
  MIGRATION_BANNER: process.env.NEXT_PUBLIC_SHOW_MIGRATION === "true",
  ROLLOUT_PERCENTAGE: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENT || "0"),
  ENABLE_GASLESS: process.env.NEXT_PUBLIC_ENABLE_GASLESS !== "false", // Default true
  DEBUG_MODE: process.env.NODE_ENV === "development",
};

// Wallet connection configuration
export const WALLET_CONFIG = {
  // In-app wallet auth options
  inAppWalletAuth: [
    "email", 
    "phone", 
    "google", 
    "apple", 
    "facebook", 
    "discord", 
    "telegram"
  ],
  
  // External wallet support - only battle-tested wallets
  externalWallets: [
    "io.metamask",
    "com.coinbase.wallet",
  ],

  // Connection timeouts (milliseconds)
  timeouts: {
    connection: 30000, // 30 seconds
    signature: 60000,  // 60 seconds
    transaction: 120000, // 2 minutes
  }
};

// GoodHive-specific theme colors for Thirdweb UI
export const GOODHIVE_THEME_COLORS = {
  // Primary honey bee brand colors
  primaryButtonBg: "linear-gradient(135deg, #ffc905 0%, #ffb300 100%)",
  primaryButtonText: "#111111",
  
  // Modal styling  
  modalBg: "#ffffff",
  modalOverlayBg: "rgba(0, 0, 0, 0.6)",
  
  // Accent colors
  borderColor: "#ffc905",
  accentText: "#ffc905", 
  accentButtonBg: "#fff3cd",
  accentButtonText: "#111111",
  
  // Text hierarchy
  primaryText: "#111111",
  secondaryText: "#666666",
  
  // Interactive states
  connectedButtonBg: "#fff3cd",
  connectedButtonBgHover: "#ffe8a1",
  
  // Status colors
  success: "#10b981",
  danger: "#ef4444", 
  warning: "#f59e0b",
};

// Connection analytics tracking
export interface ConnectionMetrics {
  wallet_type: string;
  connection_time: number;
  address: string;
  has_smart_account: boolean;
  auth_provider?: string;
  error?: string;
}

export const trackWalletEvent = (event: string, data: ConnectionMetrics) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, {
      event_category: 'wallet',
      event_label: data.wallet_type,
      custom_map: {
        connection_time: data.connection_time,
        has_smart_account: data.has_smart_account,
        auth_provider: data.auth_provider,
      }
    });
  }

  if (FEATURES.DEBUG_MODE) {
    console.log(`🐝 Wallet Event: ${event}`, data);
  }
};

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_THIRDWEB_CLIENT_ID'
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  if (FEATURES.DEBUG_MODE) {
    console.log('🐝 Environment validation passed');
    console.log('🐝 Feature flags:', FEATURES);
  }
};

// Environment validation will be performed when getThirdwebClient() is called