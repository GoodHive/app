"use client";

import Link from "next/link";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { isProtectedRoute } from "@/app/config/protectedRoutes";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import { useRouter } from "next/navigation";
import { ComponentProps, MouseEvent, useCallback } from "react";

type ProtectedLinkProps = ComponentProps<typeof Link> & {
  authDescription?: string;
};

/**
 * A Link component that checks authentication before navigating to protected routes
 * Shows auth modal on current page if user is not authenticated
 */
export function ProtectedLink({
  href,
  onClick,
  authDescription = "access this page",
  children,
  ...props
}: ProtectedLinkProps) {
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();
  const router = useRouter();

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Get the href as a string
    const targetPath = typeof href === 'string' ? href : href.toString();

    // Check if this is a protected route
    if (isProtectedRoute(targetPath)) {
      // If not authenticated, prevent navigation and show auth modal
      if (!isAuthenticated) {
        e.preventDefault();

        // Store the intended destination for post-auth redirect
        console.log('ProtectedLink: Storing protected route access for:', targetPath);
        ReturnUrlManager.setProtectedRouteAccess(targetPath);

        // Show auth modal
        checkAuthAndShowConnectPrompt(authDescription, 'access-protected');
        return;
      }
    }

    // For non-protected routes or authenticated users, let the navigation proceed normally
  }, [href, onClick, isAuthenticated, checkAuthAndShowConnectPrompt, authDescription]);

  return (
    <Link
      href={href}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}