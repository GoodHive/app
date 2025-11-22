"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import "@/utils/bigint-polyfill";
import { AuthProvider } from "./contexts/AuthContext";

const ThirdwebProvider = dynamic(
  () => import("thirdweb/react").then((mod) => mod.ThirdwebProvider),
  { ssr: false },
);

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThirdwebProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThirdwebProvider>
  );
}
