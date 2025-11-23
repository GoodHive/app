"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { analytics } from "@/lib/analytics";

interface JobPageAnalyticsProps {
  jobId: string;
  jobTitle: string;
}

export function JobPageAnalytics({ jobId, jobTitle }: JobPageAnalyticsProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Determine source of job view
    const source = searchParams.get("source") || "direct_link";

    // Track job details view
    analytics.jobDetailsViewed(jobId, jobTitle, source);
    analytics.pageViewed('job_details_page', jobId);

  }, [jobId, jobTitle, searchParams]);

  return null; // This component only tracks events
}