"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { FEATURES, getThirdwebClient, supportedChains } from "@/lib/thirdweb/config";

interface ProvidersProps {
  children: React.ReactNode;
}

// Simple error boundary for Thirdweb
function ThirdwebErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message?.includes('thirdweb')) {
        console.error('🐝 Thirdweb Error:', error);
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🐝 Wallet Connection Issue</h2>
          <p className="text-gray-600">Please refresh the page to reconnect to the GoodHive.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize Thirdweb client
  const client = getThirdwebClient();

  useEffect(() => {
    // Log Thirdweb initialization
    if (FEATURES.USE_THIRDWEB) {
      console.log('🐝 GoodHive initialized with Thirdweb');
      console.log('🐝 Supported Chains:', supportedChains.map(c => `${c.name} (${c.id})`));
      console.log('🐝 Environment:', process.env.NODE_ENV);
    } else {
      console.warn('🐝 Thirdweb not enabled - check NEXT_PUBLIC_USE_THIRDWEB');
    }
  }, []);

  // Only render if Thirdweb is enabled
  if (!FEATURES.USE_THIRDWEB) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-2">🐝 Configuration Error</h2>
          <p className="text-red-600">Thirdweb wallet service is not enabled.</p>
          <p className="text-sm text-red-500 mt-2">Please check environment configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <ThirdwebErrorBoundary>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </GoogleOAuthProvider>
    </ThirdwebErrorBoundary>
  );
}