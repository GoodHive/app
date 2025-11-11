"use client";

import type { UseConnectModalOptions } from "thirdweb/react";
import { inAppWallet, createWallet, type Wallet } from "thirdweb/wallets";

const socialAndEmailWallet = inAppWallet({
  auth: {
    options: ["email", "google", "apple", "facebook", "x"],
  },
  metadata: {
    name: "GoodHive",
    icon: "https://goodhive.io/img/goodhive-logo.png",
    image: {
      src: "https://goodhive.io/img/goodhive-logo.png",
      alt: "GoodHive Logo",
      width: 120,
      height: 29,
    },
  },
});

const metamaskWallet = createWallet("io.metamask");
const walletConnectWallet = createWallet("walletConnect");
const coinbaseWallet = createWallet("com.coinbase.wallet");

export const supportedWallets: Wallet[] = [
  socialAndEmailWallet,
  metamaskWallet,
  walletConnectWallet,
  coinbaseWallet,
];

export const connectModalOptions: Pick<
  UseConnectModalOptions,
  "title" | "theme" | "showAllWallets" | "showThirdwebBranding"
> = {
  title: "Connect to GoodHive",
  theme: "light",
  showAllWallets: true,
  showThirdwebBranding: false,
};
