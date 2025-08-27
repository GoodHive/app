"use client";

import React from "react";
import { ConnectButton, lightTheme, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { useState, useCallback, useEffect } from "react";
import { getThirdwebClient, smartAccountConfig, GOODHIVE_THEME_COLORS, WALLET_CONFIG, trackWalletEvent, getActiveChain, type ConnectionMetrics } from "@/lib/thirdweb/config";
import Cookies from "js-cookie";

// Polygon-focused wallet support  
const wallets = [
  // In-app wallets with social auth - automatically creates Polygon wallet
  inAppWallet({
    auth: {
      options: WALLET_CONFIG.inAppWalletAuth as any[],
      // Add additional auth configuration for better recovery
      mode: "popup", // Force popup mode
      redirectUrl: typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000",
    },
    smartAccount: smartAccountConfig,
  }),
  
  // External wallets - will work with existing Wagmi users  
  ...WALLET_CONFIG.externalWallets.map(walletId => createWallet(walletId as any)),
];

// Professional theme matching GoodHive honey bee branding
const honeyBeeTheme = lightTheme({
  colors: {
    ...GOODHIVE_THEME_COLORS,
  },
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
});

interface HoneyBeeConnectButtonProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  onConnect?: (account: any) => void;
  onDisconnect?: () => void;
  showBalance?: boolean;
  className?: string;
}

// Helper function to clear all Thirdweb storage
const clearThirdwebStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage items related to Thirdweb
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('thirdweb') || 
      key.includes('tw-') || 
      key.includes('walletconnect') ||
      key.includes('wc@2') ||
      key.includes('WALLETCONNECT')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('🐝 Cleared localStorage:', key);
  });
  
  // Clear sessionStorage as well
  sessionStorage.clear();
  
  // Clear IndexedDB if exists
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name?.includes('thirdweb') || db.name?.includes('walletconnect')) {
          indexedDB.deleteDatabase(db.name);
          console.log('🐝 Cleared IndexedDB:', db.name);
        }
      });
    }).catch(console.error);
  }
};

export function HoneyBeeConnectButton({
  label = "Connect to the Hive 🐝",
  size = "md",
  variant = "primary",
  onConnect,
  onDisconnect,
  showBalance = true,
  className,
}: HoneyBeeConnectButtonProps) {
  const account = useActiveAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false);
  const client = getThirdwebClient();

  // Handle successful wallet connection
  const handleConnect = useCallback(async (wallet: any) => {
    setIsProcessing(true);
    setConnectionError(null);
    setRetryAttempt(0); // Reset retry counter on new connection attempt
    const startTime = Date.now();
    
    try {
      console.log('🐝 Starting wallet connection process...');
      
      // Ensure wallet is on correct Polygon chain
      const activeChain = getActiveChain();
      if (wallet.switchChain) {
        try {
          await wallet.switchChain(activeChain);
          console.log(`🐝 Switched to ${activeChain.name} (${activeChain.id})`);
        } catch (switchError) {
          console.log('🐝 Chain switch not needed or failed:', switchError);
        }
      }
      
      // Get wallet account information
      const walletAccount = await wallet.getAccount();
      const connectionTime = Date.now() - startTime;
      
      // Prepare connection metrics
      const metrics: ConnectionMetrics = {
        wallet_type: wallet.id || 'unknown',
        connection_time: connectionTime,
        address: walletAccount.address,
        has_smart_account: !!wallet.smartAccount,
        auth_provider: wallet.authMethod || 'wallet',
      };

      // Track connection metrics
      trackWalletEvent('wallet_connected', metrics);
      console.log('🐝 Wallet connected successfully:', metrics);
      
      // Verify and create/update user in database
      const verificationStartTime = Date.now();
      const response = await fetch('/api/auth/thirdweb-verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          address: walletAccount.address,
          smartAccount: wallet.smartAccount?.address || null,
          walletType: wallet.id,
          authMethod: wallet.authMethod || 'external',
          email: wallet.email || null,
          authProvider: wallet.authMethod || 'wallet',
        }),
      });
      
      const verificationTime = Date.now() - verificationStartTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Verification failed (${response.status})`);
      }
      
      const data = await response.json();
      console.log('🐝 User verification completed:', data);
      
      // Store user session data
      if (data.user?.user_id) {
        Cookies.set('user_id', data.user.user_id, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
      
      if (walletAccount.address) {
        Cookies.set('user_address', walletAccount.address, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }

      // Track successful verification
      trackWalletEvent('wallet_verified', {
        ...metrics,
        verification_time: verificationTime,
      });

      // Call custom onConnect handler if provided
      if (onConnect) {
        onConnect({
          ...walletAccount,
          userData: data.user,
          isNewUser: data.isNewUser,
          isMigration: data.isMigration,
          migrationType: data.migrationType,
        });
      }

      // Redirect to profile after successful connection
      setTimeout(() => {
        window.location.href = '/talents/my-profile';
      }, 1000);
      
    } catch (error) {
      console.error('🐝 Connection error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      const isRecoveryShareError = errorMessage.toLowerCase().includes('missing recovery share') ||
                                   errorMessage.toLowerCase().includes('recovery share');
      const isCOOPError = errorMessage.toLowerCase().includes('cross-origin-opener-policy') ||
                          errorMessage.toLowerCase().includes('window.closed');
      
      // Handle specific error types
      if (isRecoveryShareError && retryAttempt < 2) {
        console.log('🐝 Attempting to recover from missing recovery share error...');
        setRetryAttempt(prev => prev + 1);
        
        try {
          // Clear all Thirdweb-related storage
          clearThirdwebStorage();
          
          // Wait a moment for storage to clear
          setTimeout(() => {
            setIsProcessing(false);
            // The user can try connecting again
          }, 1000);
          
          setConnectionError('🐝 Wallet recovery issue detected. Storage cleared. Please try connecting again.');
        } catch (clearError) {
          console.error('Failed to clear storage:', clearError);
          setConnectionError('🐝 Please clear your browser data and try again.');
          setShowRecoveryHelp(true);
        }
      } else if (isCOOPError) {
        setConnectionError('🐝 Browser security settings are blocking authentication. Please try refreshing the page.');
        setShowRecoveryHelp(true);
      } else if (isRecoveryShareError) {
        setConnectionError('🐝 Cannot recover your wallet. You may need to create a new account.');
        setShowRecoveryHelp(true);
      } else {
        setConnectionError(errorMessage);
      }
      
      // Track connection error
      trackWalletEvent('wallet_connection_error', {
        wallet_type: wallet?.id || 'unknown',
        connection_time: Date.now() - startTime,
        address: '',
        has_smart_account: false,
        error: errorMessage,
        error_type: isRecoveryShareError ? 'recovery_share' : isCOOPError ? 'coop' : 'other',
        retry_attempt: retryAttempt,
      });
      
    } finally {
      setIsProcessing(false);
    }
  }, [onConnect, retryAttempt]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(() => {
    console.log('🐝 Wallet disconnected');
    
    // Track disconnection
    trackWalletEvent('wallet_disconnected', {
      wallet_type: 'unknown',
      connection_time: 0,
      address: account?.address || '',
      has_smart_account: false,
    });
    
    // Clear stored session data
    Cookies.remove('user_id');
    Cookies.remove('user_address');
    
    // Clear any error states
    setConnectionError(null);
    
    // Call custom disconnect handler
    if (onDisconnect) {
      onDisconnect();
    } else {
      // Default redirect to home
      window.location.href = '/';
    }
  }, [account?.address, onDisconnect]);

  // Dynamic button styling based on size and variant
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: "12px",
      fontWeight: "600",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: "all 0.2s ease-in-out",
      boxShadow: "0 2px 8px rgba(255, 201, 5, 0.3)",
    };

    const sizeStyles = {
      sm: { padding: "8px 16px", fontSize: "14px" },
      md: { padding: "12px 24px", fontSize: "16px" },
      lg: { padding: "16px 32px", fontSize: "18px" },
    };

    const variantStyles = {
      primary: {
        background: GOODHIVE_THEME_COLORS.primaryButtonBg,
        color: GOODHIVE_THEME_COLORS.primaryButtonText,
      },
      secondary: {
        background: GOODHIVE_THEME_COLORS.accentButtonBg,
        color: GOODHIVE_THEME_COLORS.accentButtonText,
        border: `2px solid ${GOODHIVE_THEME_COLORS.borderColor}`,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <div className={`honeybee-connect-container ${className || ''}`}>
      <ConnectButton
        client={client}
        wallets={wallets}
        theme={honeyBeeTheme}
        accountAbstraction={smartAccountConfig}
        
        // Button customization with honey bee branding
        connectButton={{
          label: label,
          style: getButtonStyle(),
        }}
        
        // Modal customization with GoodHive branding
        connectModal={{
          size: "wide",
          title: "🐝 Welcome to GoodHive",
          titleIcon: "/icons/honeybee-pointing.svg",
          welcomeScreen: {
            img: {
              src: "/img/goodhive_light_logo.png",
              width: 180,
              height: 48,
            },
            title: "Join the Professional Hive",
            subtitle: "Connect your wallet to access on-chain hiring and talent matching. Choose from 500+ wallets or create a new one with just your email.",
          },
          showThirdwebBranding: false,
          termsOfServiceUrl: "/terms",
          privacyPolicyUrl: "/privacy",
        }}
        
        // Connected wallet details
        detailsButton={{
          displayBalanceToken: showBalance ? {
            // Show MATIC balance on Polygon
            [smartAccountConfig.chain.id]: "0x0000000000000000000000000000000000000000",
          } : undefined,
          style: getButtonStyle(),
        }}
        
        // Event handlers
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      
      {/* Processing state overlay */}
      {isProcessing && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div 
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center' as const,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #fff3cd',
                borderTop: '4px solid #ffc905',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ margin: 0, color: '#111111', fontWeight: '600' }}>
              🐝 Setting up your hive account...
            </p>
          </div>
        </div>
      )}
      
      {/* Error state display */}
      {connectionError && (
        <div 
          style={{
            marginTop: '12px',
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <strong>Connection Error:</strong> {connectionError}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setConnectionError(null);
                setShowRecoveryHelp(false);
                setRetryAttempt(0);
              }}
              style={{
                color: '#dc2626',
                background: 'none',
                border: '1px solid #dc2626',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Dismiss
            </button>
            
            {showRecoveryHelp && (
              <>
                <button
                  onClick={() => {
                    clearThirdwebStorage();
                    window.location.reload();
                  }}
                  style={{
                    color: '#dc2626',
                    background: 'none',
                    border: '1px solid #dc2626',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Clear Data & Refresh
                </button>
                
                <button
                  onClick={() => {
                    // Try connecting with external wallet instead
                    setConnectionError(null);
                    setShowRecoveryHelp(false);
                    setRetryAttempt(0);
                  }}
                  style={{
                    color: '#dc2626',
                    background: 'none',
                    border: '1px solid #dc2626',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Try MetaMask Instead
                </button>
              </>
            )}
          </div>
          
          {showRecoveryHelp && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              color: '#856404',
              fontSize: '12px',
            }}>
              <strong>💡 Troubleshooting Tips:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Disable browser extensions temporarily</li>
                <li>Try using incognito/private browsing mode</li>
                <li>Use a different browser (Chrome/Firefox/Safari)</li>
                <li>Connect with MetaMask or another external wallet</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}