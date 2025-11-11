"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useCallback, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export function useAuthCheck() {
  const { isAuthenticated, user } = useAuth();
  const account = useActiveAccount();
  const pathname = usePathname();
  const user_id = Cookies.get("user_id");
  const { connect, isConnecting } = useConnectModal();
  const connectInFlightRef = useRef(false);
  const modalTriggerPathnameRef = useRef<string | null>(null);

  const openConnectModal = useCallback(async () => {
    if (connectInFlightRef.current || isConnecting) {
      return;
    }

    connectInFlightRef.current = true;
    modalTriggerPathnameRef.current = pathname;

    try {
      await connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });
    } catch (error) {
      console.debug("Connect modal dismissed", error);
    } finally {
      connectInFlightRef.current = false;
      modalTriggerPathnameRef.current = null;
    }
  }, [connect, isConnecting, pathname]);

  const checkAuthAndShowConnectPrompt = useCallback(
    (
      actionDescription: string = "perform this action",
      intendedAction: 'contact' | 'access-protected' | 'service-action' = 'access-protected',
      actionData?: any
    ) => {
      // Check if user is authenticated (either through traditional auth or Thirdweb)
      if (!isAuthenticated && !user_id && !account?.address) {
        // Store the current context for prompted authentication
        const currentUrl = pathname;

        if (intendedAction === 'contact') {
          ReturnUrlManager.setContactAction(currentUrl, actionData);
        } else if (intendedAction === 'access-protected') {
          // For access-protected, only set context if none exists
          // This prevents overwriting context set by ProtectedLink
          const existingContext = ReturnUrlManager.getAuthContext();
          if (!existingContext || !existingContext.returnUrl) {
            console.log('useAuthCheck: Setting protected route access for current URL:', currentUrl);
            ReturnUrlManager.setProtectedRouteAccess(currentUrl);
          } else {
            console.log('useAuthCheck: Keeping existing context:', existingContext);
          }
        } else if (intendedAction === 'service-action') {
          ReturnUrlManager.setServiceAction(currentUrl, actionData?.serviceType);
        }

        // Show a toast prompting user to connect
        toast.error(`Please connect your wallet to ${actionDescription}`, {
          duration: 5000,
          icon: '🔐',
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FCD34D',
          },
        });
        void openConnectModal();

        return false; // Not authenticated
      }

      return true; // Authenticated
    },
    [account?.address, isAuthenticated, openConnectModal, user_id, pathname],
  );

  const setManualConnection = useCallback(() => {
    ReturnUrlManager.setManualConnection();
  }, []);

  // Effect to handle modal cleanup when navigating away
  useEffect(() => {
    const closeModal = () => {
      // Try multiple selectors as Thirdweb's modal structure may vary
      const closeButtonSelectors = [
        'button[aria-label="Close"]',
        'button[aria-label="close"]',
        'button[data-close]',
        '[role="dialog"] button:first-child',
        'button svg[data-testid="close-icon"]',
        // Look for any button with an X or close icon
        'div[role="dialog"] button[type="button"]:first-of-type',
        // Thirdweb specific selectors
        '[data-tw-modal] button[aria-label="Close"]',
        '.tw-connected-wallet-modal button[aria-label="Close"]'
      ];

      let modalClosed = false;
      for (const selector of closeButtonSelectors) {
        try {
          const closeButton = document.querySelector(selector);
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
            modalClosed = true;
            console.debug('Modal closed using selector:', selector);
            break;
          }
        } catch (e) {
          // Selector might be invalid, continue to next
          continue;
        }
      }

      // If no close button found, try to press Escape key
      if (!modalClosed) {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true
        });
        document.dispatchEvent(escEvent);
      }

      return modalClosed;
    };

    // Always try to close any open modal when pathname changes
    // This handles both:
    // 1. Navigation away from a page that triggered the modal
    // 2. Direct navigation to protected routes then navigating away
    const modalCheck = setTimeout(() => {
      const modalPresent = document.querySelector('[role="dialog"], [data-tw-modal], .tw-connected-wallet-modal');
      if (modalPresent) {
        // A modal is present, close it
        closeModal();
        // Clean up our tracking refs
        connectInFlightRef.current = false;
        modalTriggerPathnameRef.current = null;
      }
    }, 100);

    return () => clearTimeout(modalCheck);
  }, [pathname]); // Run whenever pathname changes

  return {
    isAuthenticated: isAuthenticated || !!user_id || !!account?.address,
    user,
    user_id,
    checkAuthAndShowConnectPrompt,
    openConnectModal,
    setManualConnection,
  };
}
