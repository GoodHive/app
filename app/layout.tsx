"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";

import { Footer } from "@components/footer/footer";
import { NavBar } from "@components/nav-bar";
import LastActiveHandler from "./components/LastActiveHandler";
import OnboardingPopup from "./components/Onboarding/OnboardingPopup";
import ReferralCodeHandler from "./components/referralCodeHandler/ReferralCodeHandler";
import "./globals.css";
import { Providers } from "./providers";

// Suppress hydration warnings for browser extension attributes
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.(
        "Extra attributes from the server: cz-shortcut-listen",
      )
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if we're in the admin section
  const isAdminSection = pathname?.startsWith("/admin");

  useEffect(() => {
    try {
      // Check if user is logged in via new cookie system
      const userId = Cookies.get("user_id");
      
      if (!userId) {
        return; // Exit if no user ID found
      }

      // For now, we'll use a simple approach to show onboarding
      // This can be enhanced later with proper user status checking
      const hasSeenOnboarding = localStorage.getItem('goodhive_onboarding_seen');
      
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking user status for onboarding:", error);
    }
  }, []);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('goodhive_onboarding_seen', 'true');
  };

  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <OnboardingPopup
            isOpen={showOnboarding}
            onClose={handleOnboardingClose}
          />
          <div className="flex flex-col min-h-screen">
            {!isAdminSection && <NavBar />}
            <Toaster />

            <Suspense>
              <ReferralCodeHandler />
              <div className="flex-grow">
                <LastActiveHandler />
                {children}
              </div>
            </Suspense>
            {!isAdminSection && <Footer />}
          </div>
        </Providers>
      </body>
    </html>
  );
}