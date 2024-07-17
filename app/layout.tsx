"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Cookies from "js-cookie";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { polygon } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import {
  getDefaultWallets,
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  AuthenticationStatus,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Toaster } from "react-hot-toast";
import { SiweMessage } from "siwe";

import { SwitchWalletCheck } from "@components/switch-wallet-check";
import { NavBar } from "@components/nav-bar";
import { Footer } from "@components/footer/footer";
import { GoodhiveInfuraApi } from "./constants/common";

import AddressContextWrapper from "./components/addressContextWrapper/AddressContextWrapper";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: GoodhiveInfuraApi,
      }),
    }),
  ]
);

const projectId = "c1de7de6d9dac11ced03c7516792c20c";

const connectors = connectorsForWallets([
  {
    groupName: "My Goodhive App",
    wallets: [
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }), // FIXME: WalletConnect is not working as expected
    ],
  },
]);

export const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
  webSocketPublicClient,
});

export const fetchCache = "force-no-store";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>("loading");
  const [walletAddress, setWalletAddress] = useState<string>("");

  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  useEffect(() => {
    if (referralCode) {
      Cookies.set("referralCode", referralCode, { expires: 30 });
    }
  }, [referralCode]);

  // FIXED BUT KEP FOR REFERENCE - ADDRESS CONTEXT WRAPPER
  // useEffect(() => {
  //   const fetchStatus = async () => {
  //     if (fetchingStatusRef.current || verifyingRef.current) {
  //       return;
  //     }

  //     fetchingStatusRef.current = true;

  //     try {
  //       const checkAuthResponse = await fetch("/api/auth/me");

  //       const authResponse = await checkAuthResponse.json();

  //       const authenticated = Boolean(authResponse?.ok === true);

  //       if (authenticated) {
  //         setAuthStatus("authenticated");
  //         Cookies.set("walletAddress", authResponse?.address);
  //         setWalletAddress(authResponse?.address);
  //       } else {
  //         setAuthStatus("unauthenticated");
  //       }
  //     } catch (error) {
  //       console.error(error);

  //       setAuthStatus("unauthenticated");
  //     } finally {
  //       fetchingStatusRef.current = false;
  //     }
  //   };

  //   if (!walletAddressCookie) fetchStatus();

  //   window.addEventListener("focus", fetchStatus);

  //   return () => window.removeEventListener("focus", fetchStatus);
  // }, [walletAddressCookie]);

  const authAdapter = useMemo(() => {
    return createAuthenticationAdapter({
      getNonce: async () => {
        const generateCookieNonceResponse = await fetch("/api/auth/nonce");

        return await generateCookieNonceResponse.text();
      },

      createMessage: ({ nonce, address, chainId }) => {
        return new SiweMessage({
          domain: window.location.host,
          address,
          statement: "Sign in with Ethereum to the app.",
          uri: window.location.origin,
          version: "1",
          chainId,
          nonce,
        });
      },

      getMessageBody: ({ message }) => {
        return message.prepareMessage();
      },

      verify: async ({ message, signature }) => {
        verifyingRef.current = true;

        try {
          const singatureVerifyResponse = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, signature }),
          });

          const verifyResponse = await singatureVerifyResponse.json();

          const authenticated = Boolean(verifyResponse?.ok === true);

          if (authenticated) {
            setAuthStatus("authenticated");
            setWalletAddress(verifyResponse?.address);
          } else {
            setAuthStatus("unauthenticated");
          }

          return authenticated;
        } catch (error) {
          console.error(error);

          setAuthStatus("unauthenticated");

          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus("unauthenticated");
        const logoutResponse = await fetch("/api/auth/logout");

        if (!logoutResponse.ok) {
          console.error("Error logging out");
        } else {
          window.location.reload();
        }
      },
    });
  }, []);

  const handleWalletChange = async () => {
    setAuthStatus("unauthenticated");
    const logoutResponse = await fetch("/api/auth/logout");

    if (!logoutResponse.ok) {
      console.error("Error logging out");
    }
  };

  return (
    <html lang="en">
      <body className="min-h-screen">
        <WagmiConfig config={config}>
          <RainbowKitAuthenticationProvider
            adapter={authAdapter}
            status={authStatus}
          >
            <RainbowKitProvider chains={chains}>
              <SwitchWalletCheck
                walletAddress={walletAddress}
                handleWalletChange={handleWalletChange}
              />
              <div className="flex flex-col min-h-screen">
                <NavBar />
                <Toaster />

                <div className="flex-grow">
                  <AddressContextWrapper setAuthStatus={setAuthStatus}>
                    {children}
                  </AddressContextWrapper>
                </div>
                <Footer />
              </div>
            </RainbowKitProvider>
          </RainbowKitAuthenticationProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
