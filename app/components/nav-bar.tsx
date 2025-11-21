"use client";

import Cookies from "js-cookie";
import {
  ConnectButton,
  useActiveAccount,
  useConnectModal,
} from "thirdweb/react";

import { useAuth } from "@/app/contexts/AuthContext";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";
import { ReturnUrlManager } from "@/app/utils/returnUrlManager";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import {
  authenticateWithWallet,
  detectWalletType,
  extractWalletAuthData,
  getEmailFromInAppWallet,
  logoutWalletUser,
} from "@/lib/auth/thirdwebAuth";
import { connectModalOptions, supportedWallets } from "@/lib/auth/walletConfig";
import { CircleUserRound } from "lucide-react";
import { ProfileDropdown } from "./ProfileDropdown";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import EmailVerificationModal from "./EmailVerificationModal";
import { ProtectedLink } from "./ProtectedLink";
import { OnboardingPopup } from "./onboarding-popup";

const commonLinks = [
  { href: "/talents/job-search", label: "Find a Job", protected: false },
  {
    href: "/companies/search-talents",
    label: "Find a Talent",
    protected: false,
  },
];

const talentsLinks = [
  { href: "/talents/job-search", label: "Job Search", protected: false },
  { href: "/talents/my-profile", label: "My Talent Profile", protected: true },
];

const companiesLinks = [
  {
    href: "/companies/search-talents",
    label: "Search Talents",
    protected: false,
  },
  { href: "/companies/dashboard", label: "Dashboard", protected: true },
  {
    href: "/companies/my-profile",
    label: "My Company Profile",
    protected: true,
  },
];

export const NavBar = () => {
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [walletAddressToVerify, setWalletAddressToVerify] = useState("");
  const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { navigate: protectedNavigate } = useProtectedNavigation();
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnectModal();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { setManualConnection } = useAuthCheck();
  const connectModalShownRef = useRef(false);

  const loggedIn_user_id = Cookies.get("user_id");

  const links = pathname.startsWith("/talents")
    ? talentsLinks
    : pathname.startsWith("/companies")
      ? companiesLinks
      : commonLinks;

  // Handle wallet connection/disconnection
  useEffect(() => {
    const handleWalletAuth = async () => {
      if (account?.address && !loggedIn_user_id && !isAuthenticating) {
        setIsAuthenticating(true);

        try {
          // Debug the account object structure
          console.log("Account in handleWalletAuth:", account);

          // IMPORTANT: For Thirdweb social wallets, the account from useActiveAccount()
          // doesn't have wallet property, but we can detect it's a social wallet
          // by trying to get the email first
          let extractedEmail: string | undefined;
          let isThirdwebSocialWallet = false;

          // Try to get email from Thirdweb SDK first
          try {
            const email = await getEmailFromInAppWallet(thirdwebClient);
            if (email) {
              extractedEmail = email;
              isThirdwebSocialWallet = true;
              console.log(
                "Successfully detected Thirdweb social wallet with email:",
                email,
              );
            }
          } catch (error) {
            console.log("Not a Thirdweb social wallet or email not available");
          }

          // Extract wallet data with the detected information
          const walletData = extractWalletAuthData(
            account,
            extractedEmail,
            isThirdwebSocialWallet,
          );
          if (!walletData) {
            throw new Error("Failed to extract wallet data");
          }

          // Override with correct values if we detected a social wallet
          if (isThirdwebSocialWallet) {
            walletData.isThirdwebWallet = true;
            walletData.walletType = "in-app";
            walletData.email = extractedEmail;
          }

          // For in-app wallets without email, try API fallback
          if (walletData.isThirdwebWallet && !walletData.email) {
            try {
              console.log("Trying API fallback to get email");
              const typeInfo = await detectWalletType(account.address);
              if (typeInfo.userInfo?.primaryEmail) {
                walletData.email = typeInfo.userInfo.primaryEmail;
                console.log("Got email from API:", walletData.email);
              }
            } catch (error) {
              console.log("API fallback also failed:", error);
            }
          }

          // Log wallet data for debugging
          console.log("Wallet authentication data:", {
            address: walletData.address,
            email: walletData.email,
            isThirdwebWallet: walletData.isThirdwebWallet,
            walletType: walletData.walletType,
          });

          // Authenticate with backend
          const authResult = await authenticateWithWallet(walletData);

          if (authResult.success) {
            toast.success(
              authResult.isNewUser
                ? "Welcome to GoodHive! Account created successfully."
                : "Welcome back!",
            );

            // Update auth context
            login(authResult.user);

            // Show onboarding popup for new users
            if (authResult.isNewUser) {
              setShowOnboardingPopup(true);
            }

            // If no email was captured, show a notification
            if (walletData.isThirdwebWallet && !walletData.email) {
              toast(
                "Consider adding your email in profile settings for account recovery",
                {
                  icon: "ℹ️",
                  duration: 5000,
                },
              );
            }

            // Handle post-authentication redirect
            const redirectUrl = ReturnUrlManager.getRedirectUrl();
            const postAuthAction = ReturnUrlManager.getPostAuthAction();

            console.log(
              "Post-auth redirect - URL:",
              redirectUrl,
              "Action:",
              postAuthAction,
            );

            if (redirectUrl) {
              console.log("Redirecting to:", redirectUrl);
              router.push(redirectUrl);

              // Handle post-auth actions
              if (postAuthAction?.type === "show-contact-modal") {
                // This will be handled by the company contact button component
                // after the page loads and user is authenticated
                setTimeout(() => {
                  const event = new CustomEvent("show-contact-modal", {
                    detail: postAuthAction.data,
                  });
                  window.dispatchEvent(event);
                }, 500);
              }
            } else {
              console.log("No redirect URL found, using fallback");
              // Fallback to homepage if no redirect URL is set
              router.push("/");
            }

            // Clear auth context after handling
            ReturnUrlManager.clearAuthContext();
          } else if (authResult.requiresEmailVerification) {
            // User doesn't exist - need email verification
            console.log(
              "Email verification required for wallet:",
              walletData.address,
            );
            setWalletAddressToVerify(walletData.address);
            setShowEmailVerification(true);
          } else {
            toast.error(authResult.error || "Authentication failed");
          }
        } catch (error) {
          console.error("Wallet authentication error:", error);
          toast.error("Failed to authenticate wallet");
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    handleWalletAuth();
  }, [account, loggedIn_user_id, isAuthenticating, login, router]);

  const handleEmailVerificationSuccess = (
    user: any,
    isNewUser: boolean = true,
  ) => {
    // Update auth context with verified user
    login(user);
    setShowEmailVerification(false);
    setWalletAddressToVerify("");

    toast.success("Email verified successfully! Welcome to GoodHive!");

    // Show onboarding popup for new users after email verification
    if (isNewUser) {
      setShowOnboardingPopup(true);
    }

    // Handle post-authentication redirect (same logic as above)
    const redirectUrl = ReturnUrlManager.getRedirectUrl();
    const postAuthAction = ReturnUrlManager.getPostAuthAction();

    if (redirectUrl) {
      router.push(redirectUrl);

      // Handle post-auth actions
      if (postAuthAction?.type === "show-contact-modal") {
        setTimeout(() => {
          const event = new CustomEvent("show-contact-modal", {
            detail: postAuthAction.data,
          });
          window.dispatchEvent(event);
        }, 500);
      }
    } else {
      // Fallback to homepage if no redirect URL is set
      router.push("/");
    }

    // Clear auth context after handling
    ReturnUrlManager.clearAuthContext();
  };

  const handleOnboardingClose = () => {
    setShowOnboardingPopup(false);
  };

  const handleOnboardingContinue = () => {
    setShowOnboardingPopup(false);
    // Redirect to talents profile page after onboarding
    router.push("/talents/my-profile");
  };

  const handleWalletDisconnect = async () => {
    try {
      // Clear backend session
      await logoutWalletUser();

      // Clear client-side auth context and any stored redirects
      logout();
      ReturnUrlManager.clearAuthContext();

      toast.success("Successfully disconnected");

      // Redirect to homepage after disconnect
      router.push("/");
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast.error("Failed to disconnect. Please try again.");
    }
  };

  const handleConnectButtonClick = () => {
    // Set manual connection context before opening modal
    setManualConnection();
  };

  const handleOnConnect = async (wallet: any) => {
    console.log("=== WALLET CONNECTION DEBUG ===");
    console.log("Full wallet object:", wallet);
    console.log("Wallet ID:", wallet.id);
    console.log("Wallet walletId:", wallet.walletId);
    console.log("Wallet type:", wallet.type);
    console.log("Wallet connector:", wallet.connector);

    const account = await wallet.getAccount();
    console.log("Account object:", account);
    console.log("Account address:", account?.address);

    // Check if this is a social/in-app wallet
    const isSocialWallet =
      wallet.id === "inApp" ||
      wallet.walletId === "inApp" ||
      wallet.id?.includes("social") ||
      wallet.id?.includes("email") ||
      wallet.id?.includes("google");

    console.log("Is social wallet?", isSocialWallet);

    // Try to get email immediately after connection for in-app wallets
    if (isSocialWallet) {
      try {
        const email = await getEmailFromInAppWallet(thirdwebClient);
        console.log("Email from in-app wallet:", email);
      } catch (error) {
        console.log("Could not get email immediately after connection:", error);
      }
    }
    console.log("=== END WALLET DEBUG ===");
  };

  useEffect(() => {
    const promptFromQuery = searchParams?.get("connectWallet") === "true";
    const shouldPrompt =
      promptFromQuery &&
      !connectModalShownRef.current &&
      !isConnecting &&
      !isAuthenticated &&
      !loggedIn_user_id &&
      !account?.address;

    if (!shouldPrompt) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    connectModalShownRef.current = true;

    const params = new URLSearchParams(searchParams!.toString());
    params.delete("connectWallet");

    const newQuery = params.toString();
    const { pathname: currentPathname, hash } = window.location;
    const cleanedUrl = `${currentPathname}${newQuery ? `?${newQuery}` : ""}${hash ?? ""}`;

    void connect({
      client: thirdwebClient,
      wallets: supportedWallets,
      chain: activeChain,
      ...connectModalOptions,
    }).finally(() => {
      connectModalShownRef.current = false;
    });

    // Clean up the query param to avoid repeated prompts on navigation
    router.replace(cleanedUrl, { scroll: false });
  }, [
    account?.address,
    connect,
    isAuthenticated,
    isConnecting,
    loggedIn_user_id,
    router,
    searchParams,
  ]);

  return (
    <>
      <EmailVerificationModal
        open={showEmailVerification}
        onClose={() => {
          setShowEmailVerification(false);
          setWalletAddressToVerify("");
        }}
        walletAddress={walletAddressToVerify}
        onVerificationSuccess={handleEmailVerificationSuccess}
      />

      <OnboardingPopup
        isOpen={showOnboardingPopup}
        onClose={handleOnboardingClose}
        onContinue={handleOnboardingContinue}
      />

      <header
        aria-label="Site Header"
        className="sticky top-0 z-40 bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 shadow-lg border-b border-amber-200 backdrop-blur-sm"
      >
        <div className="flex items-center h-16 gap-8 px-8 mx-auto sm:px-6">
          <Link className="block group" href="/">
            <span className="sr-only">Home</span>
            {/* Enhanced Logo with same styling as hero section */}
            <div className="relative">
              <div className="relative z-10 group-hover:scale-105 transition-transform duration-300">
                <Image
                  className="block sm:hidden drop-shadow-lg object-contain"
                  src="/img/goodhive-logo.png"
                  alt="GoodHive Logo"
                  width={160}
                  height={39}
                />
                <Image
                  className="sm:block hidden drop-shadow-lg object-contain"
                  src="/img/goodhive-logo.png"
                  alt="GoodHive Logo"
                  width={120}
                  height={29}
                />
              </div>
              {/* Logo enhancement particles - smaller for navbar */}
              <div
                className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 rounded-full opacity-60 animate-bounce group-hover:animate-ping"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-50 animate-bounce group-hover:animate-ping"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </Link>

          <div className="flex items-center sm:justify-end flex-1 justify-between gap-8">
            <nav aria-label="Site Nav" className="hidden sm:block">
              <ul className="flex items-center gap-8 text-sm">
                {links.map(({ href, label, protected: isProtected }) => (
                  <li key={`${href}${label}`}>
                    {isProtected ? (
                      <ProtectedLink
                        href={href as Route}
                        className="text-gray-700 font-medium transition hover:text-amber-700 hover:scale-105 active:scale-95"
                        authDescription={`access ${label.toLowerCase()}`}
                      >
                        {label}
                      </ProtectedLink>
                    ) : (
                      <Link
                        href={href as Route}
                        className="text-gray-700 font-medium transition hover:text-amber-700 hover:scale-105 active:scale-95"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              {/* Always show ConnectButton - it adapts based on wallet state */}
              <div onClick={handleConnectButtonClick}>
                <ConnectButton
                  client={thirdwebClient}
                  wallets={supportedWallets}
                  chain={activeChain}
                  onDisconnect={handleWalletDisconnect}
                  theme="light"
                  connectButton={{
                    label: "Connect Wallet",
                  }}
                  onConnect={handleOnConnect}
                  connectModal={{
                    title: "Connect to GoodHive",
                    size: "wide",
                    showThirdwebBranding: false,
                  }}
                />
              </div>

              {/* Show profile dropdown when user is authenticated */}
              {(isAuthenticated || loggedIn_user_id) && (
                <ProfileDropdown
                  isAuthenticated={isAuthenticated || !!loggedIn_user_id}
                  trigger={
                    <CircleUserRound
                      size={36}
                      className="cursor-pointer text-gray-600 hover:text-amber-700 transition-all duration-300 group-hover:scale-110"
                    />
                  }
                />
              )}

              <button
                onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
                className="block sm:hidden rounded-lg bg-amber-200 border border-amber-300 p-2.5 text-amber-800 transition hover:bg-amber-300 hover:text-amber-900 hover:scale-105 active:scale-95"
              >
                <span className="sr-only">Toggle menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {isOpenMobileMenu ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isOpenMobileMenu && (
          <div className="bg-gradient-to-b from-amber-50 to-amber-100 border-t border-amber-200 shadow-inner">
            <nav aria-label="Site Nav" className="block sm:hidden">
              <ul className="flex flex-col items-center justify-center gap-4 py-4 text-sm">
                {links.map(({ href, label, protected: isProtected }) => (
                  <li key={`${href}${label}`}>
                    {isProtected ? (
                      <ProtectedLink
                        href={href as Route}
                        className="text-gray-700 font-medium transition hover:text-amber-700 hover:scale-105 active:scale-95"
                        authDescription={`access ${label.toLowerCase()}`}
                      >
                        {label}
                      </ProtectedLink>
                    ) : (
                      <Link
                        href={href as Route}
                        className="text-gray-700 font-medium transition hover:text-amber-700 hover:scale-105 active:scale-95"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
