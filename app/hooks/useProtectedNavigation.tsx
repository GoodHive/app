"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuthCheck } from "./useAuthCheck";
import { isProtectedRoute } from "@/app/config/protectedRoutes";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";

/**
 * Hook for programmatic navigation with authentication checks
 * Returns a navigate function that checks auth before routing to protected pages
 */
export function useProtectedNavigation() {
  const router = useRouter();
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();

  const navigate = useCallback((
    path: string,
    options?: {
      authDescription?: string;
      intendedAction?: 'contact' | 'access-protected' | 'service-action';
      actionData?: any;
    }
  ) => {
    const {
      authDescription = "access this page",
      intendedAction = 'access-protected',
      actionData
    } = options || {};

    // Check if this is a protected route
    if (isProtectedRoute(path)) {
      // If not authenticated, show auth modal instead of navigating
      if (!isAuthenticated) {
        // Store the intended destination for post-auth redirect
        if (intendedAction === 'access-protected') {
          ReturnUrlManager.setProtectedRouteAccess(path);
        } else if (intendedAction === 'service-action') {
          ReturnUrlManager.setServiceAction(path, actionData?.serviceType);
        }

        // Show auth modal on current page
        checkAuthAndShowConnectPrompt(authDescription, intendedAction, actionData);
        return false; // Indicate navigation was blocked
      }
    }

    // For non-protected routes or authenticated users, navigate normally
    router.push(path as any);
    return true; // Indicate navigation succeeded
  }, [router, isAuthenticated, checkAuthAndShowConnectPrompt]);

  return { navigate, isAuthenticated };
}