"use client";

import { useEffect, useState } from "react";
import { Loader } from "../loader";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          setIsChecking(false);
        } else {
          // Not authenticated, store the protected route and show connect prompt
          ReturnUrlManager.setProtectedRouteAccess(pathname);

          toast.error("Please connect your wallet to access this page", {
            duration: 5000,
            icon: '🔐',
          });

          setTimeout(() => {
            checkAuthAndShowConnectPrompt("access this page", "access-protected");
            setIsChecking(false);
          }, 500);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        ReturnUrlManager.setProtectedRouteAccess(pathname);
        checkAuthAndShowConnectPrompt("access this page", "access-protected");
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [checkAuthAndShowConnectPrompt, pathname]);

  if (isChecking) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to continue</p>
          <button
            onClick={() => {
              ReturnUrlManager.setProtectedRouteAccess(pathname);
              checkAuthAndShowConnectPrompt("access this page", "access-protected");
            }}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
