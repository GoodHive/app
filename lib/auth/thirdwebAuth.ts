import { isAddress } from "thirdweb";
import { getUserEmail } from "thirdweb/wallets/in-app";
import type { ThirdwebClient } from "thirdweb";

export interface WalletAuthData {
  address: string;
  email?: string;
  isThirdwebWallet?: boolean;
  walletType?: string;
}

/**
 * Validates if a wallet address is valid
 */
export function validateWalletAddress(address: string): boolean {
  if (!address) return false;
  
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalizes wallet address to lowercase
 */
export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Detects if wallet is a Thirdweb in-app wallet
 */
export async function detectWalletType(walletAddress: string): Promise<{
  isThirdwebWallet: boolean;
  userInfo?: any;
}> {
  try {
    const response = await fetch("/api/auth/thirdweb-user-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletAddress }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        isThirdwebWallet: data.isThirdwebWallet,
        userInfo: data.userInfo,
      };
    }
  } catch (error) {
    console.error("Wallet type detection failed:", error);
  }

  return { isThirdwebWallet: false };
}

/**
 * Extracts email from Thirdweb in-app wallet
 */
export async function getEmailFromInAppWallet(client: ThirdwebClient): Promise<string | undefined> {
  try {
    const email = await getUserEmail({ client });
    return email;
  } catch (error) {
    console.error("Failed to get email from in-app wallet:", error);
    return undefined;
  }
}

/**
 * Extracts wallet data from Thirdweb account
 */
export function extractWalletAuthData(account: any, email?: string, isThirdwebWallet?: boolean): WalletAuthData | null {
  if (!account?.address) {
    return null;
  }

  if (!validateWalletAddress(account.address)) {
    throw new Error("Invalid wallet address");
  }

  // Try to determine wallet type from account object
  let walletType = 'external';
  
  // Check various ways to identify in-app/social wallets
  if (account.wallet?.id) {
    const walletId = account.wallet.id.toLowerCase();
    // In-app wallet IDs typically include "inApp" or specific auth method
    if (walletId.includes('inapp') || 
        walletId.includes('google') || 
        walletId.includes('email') ||
        walletId.includes('apple') ||
        walletId.includes('facebook') ||
        walletId.includes('social') ||
        walletId.includes('x')) {
      walletType = 'in-app';
    }
  }
  
  // Also check if it's the socialAndEmailWallet type
  if (account.wallet?.walletId === 'inApp' || account.wallet?.connector?.id === 'inApp') {
    walletType = 'in-app';
  }
  
  // Check for Thirdweb's embedded wallet signature
  if (account.client?.clientId || account.wallet?.getChain) {
    walletType = 'in-app';
  }

  return {
    address: normalizeWalletAddress(account.address),
    email: email || undefined,
    isThirdwebWallet: isThirdwebWallet ?? (walletType === 'in-app'),
    walletType,
  };
}

/**
 * Authenticates user with wallet via API
 */
export async function authenticateWithWallet(
  walletData: WalletAuthData
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  isNewUser?: boolean;
  requiresEmailVerification?: boolean;
}> {
  try {
    const response = await fetch("/api/auth/thirdweb-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress: walletData.address,
        email: walletData.email,
        isThirdwebWallet: walletData.isThirdwebWallet,
        walletType: walletData.walletType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Authentication failed",
      };
    }

    // Check if email verification is required
    if (data.requiresEmailVerification) {
      return {
        success: false,
        requiresEmailVerification: true,
      };
    }

    return {
      success: true,
      user: data.user,
      isNewUser: data.isNewUser,
    };
  } catch (error) {
    console.error("Wallet authentication error:", error);
    return {
      success: false,
      error: "Network error during authentication",
    };
  }
}

/**
 * Checks if user is authenticated via wallet
 */
export function isWalletAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  
  const sessionToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("session_token="));
    
  return !!sessionToken;
}

/**
 * Logs out wallet user and clears all session data
 */
export async function logoutWalletUser(): Promise<void> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Logout request failed");
    }
  } catch (error) {
    console.error("Logout API error:", error);
  }

  // Clear cookies manually as fallback to ensure cleanup
  if (typeof window !== "undefined") {
    const cookiesToClear = [
      "session_token",
      "user_id", 
      "user_email",
      "loggedIn_user",
      "user_address"
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    });

    // Also clear localStorage if used
    try {
      localStorage.removeItem("walletconnect");
      localStorage.removeItem("thirdweb:active-wallet");
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}