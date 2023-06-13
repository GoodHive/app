"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { WagmiConfig, createConfig, configureChains, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import {
  getDefaultWallets,
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  AuthenticationStatus,
} from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { SiweMessage } from "siwe";

import { NavBar } from "./components/nav-bar";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "My Goodhive App",
  projectId: "GOODHIVE",
  chains,
});

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
  webSocketPublicClient,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>("loading");

  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current || verifyingRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        // TODO: check if the user is authenticated
        const hasCookieNonce = Boolean(false); // Mocking this for now

        if (hasCookieNonce) {
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        console.error(error);

        setAuthStatus("unauthenticated");
      } finally {
        fetchingStatusRef.current = false;
      }
    };

    fetchStatus();

    window.addEventListener("focus", fetchStatus);
    return () => window.removeEventListener("focus", fetchStatus);
  }, []);

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
            setAuthStatus(authenticated ? "authenticated" : "unauthenticated");
          }

          return authenticated;
        } catch (error) {
          console.error(error);

          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus("unauthenticated");
      },
    });
  }, []);

  return (
    <html lang="en">
      <body>
        <WagmiConfig config={config}>
          <RainbowKitAuthenticationProvider
            adapter={authAdapter}
            status={authStatus}
          >
            <RainbowKitProvider chains={chains}>
              <NavBar />
              <Toaster />
              {children}
            </RainbowKitProvider>
          </RainbowKitAuthenticationProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
