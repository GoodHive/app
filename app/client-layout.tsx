"use client";

import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import { Footer } from "@components/footer/footer";
import { NavBar } from "@components/nav-bar";

import LastActiveHandler from "./components/LastActiveHandler";
import OnboardingPopup from "./components/Onboarding/OnboardingPopup";
import ReferralCodeHandler from "./components/referralCodeHandler/ReferralCodeHandler";
import { Providers } from "./providers";
import { AnalyticsProvider } from "./components/AnalyticsProvider";

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isAdminSection = pathname?.startsWith("/admin");

  useEffect(() => {
    try {
      const loggedInUserCookie = Cookies.get("loggedIn_user");

      if (!loggedInUserCookie) {
        return;
      }

      const loggedInUser = JSON.parse(loggedInUserCookie);

      if (!loggedInUser) {
        return;
      }

      const isMentorPending =
        loggedInUser.mentor_status === "pending" || !loggedInUser.mentor_status;
      const isRecruiterPending =
        loggedInUser.recruiter_status === "pending" ||
        !loggedInUser.recruiter_status;
      const isTalentPending =
        loggedInUser.talent_status === "pending" || !loggedInUser.talent_status;

      const allStatusesPending =
        isMentorPending && isRecruiterPending && isTalentPending;

      // Temporarily disabled - will integrate later with the website
      // if (allStatusesPending) {
      //   setShowOnboarding(true);
      // }
    } catch (error) {
      console.error("Error checking user status for onboarding:", error);
    }
  }, []);

  return (
    <Providers>
      <OnboardingPopup
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
        }}
      />
      <div className="flex flex-col min-h-screen">
        {!isAdminSection && <NavBar />}
        <Toaster />

        <Suspense>
          <AnalyticsProvider />
          <ReferralCodeHandler />
          <div className="flex-grow">
            <LastActiveHandler />
            {children}
          </div>
        </Suspense>
        {!isAdminSection && <Footer />}
      </div>
    </Providers>
  );
}
