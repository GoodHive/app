"use client";

import React, { useState, useCallback } from "react";
import { ConnectButton, lightTheme } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getActiveChain } from "@/lib/thirdweb/config";

// Get chain based on environment
const activeChain = getActiveChain();

// Create client directly - no singleton pattern to avoid caching issues
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "4cbd356d64bab5853980d03c39c0a10b",
});

// Simple wallet configuration - email/phone first, social as backup
const wallets = [
  // Email/Phone wallets are more reliable than social
  inAppWallet({
    auth: {
      options: ["email", "phone"],
    },
  }),
  
  // MetaMask as the most reliable external wallet
  createWallet("io.metamask"),
];

// Simple theme
const theme = lightTheme({
  colors: {
    primaryButtonBg: "#ffc905",
    primaryButtonText: "#111111",
    modalBg: "#ffffff",
  },
});

interface SimpleConnectButtonProps {
  label?: string;
  onSuccess?: () => void;
}

export function SimpleConnectButton({ 
  label = "🐝 Connect Wallet",
  onSuccess 
}: SimpleConnectButtonProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async (wallet: any) => {
    setIsConnecting(true);
    
    try {
      // Get wallet address
      const account = await wallet.getAccount();
      
      // Determine auth method based on wallet type
      const isInAppWallet = wallet.id?.startsWith('inApp') || wallet.id?.includes('email') || wallet.id?.includes('phone');
      const authMethod = isInAppWallet ? 'in-app' : 'external';
      
      // Simple verification - just save the user
      const response = await fetch('/api/auth/thirdweb-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: account.address,
          authMethod: authMethod,
          authProvider: wallet.id || 'unknown',
          walletType: wallet.id || 'unknown',
        }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();
      
      // Save user session
      if (data.user?.user_id) {
        Cookies.set('user_id', data.user.user_id, { expires: 7 });
        Cookies.set('user_address', account.address, { expires: 7 });
      }

      toast.success('Connected successfully!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/talents/my-profile');
      }
      
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [router, onSuccess]);

  return (
    <>
      <ConnectButton
        client={client}
        wallets={wallets}
        theme={theme}
        chain={activeChain}
        connectButton={{
          label: label,
        }}
        connectModal={{
          size: "compact",
          title: "Connect to GoodHive",
          showThirdwebBranding: false,
        }}
        onConnect={handleConnect}
      />
      
      {isConnecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
          }}>
            <p>🐝 Connecting...</p>
          </div>
        </div>
      )}
    </>
  );
}