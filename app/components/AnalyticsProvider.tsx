"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { trackUTMParameters, analytics } from "@/lib/analytics";

export function AnalyticsProvider() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Track UTM parameters and referrals on initial page load
    trackUTMParameters();

    // Track page views for all pages
    analytics.pageViewed(pathname);
  }, [searchParams, pathname]);

  return null; // This component only tracks events
}