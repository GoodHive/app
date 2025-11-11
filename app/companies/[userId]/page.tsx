"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./company-profile.module.scss";
import "@/app/styles/company-profile-enhanced.scss";

import { AnimatedJobSection } from "@/app/components/companies/animated-job-section";
import { CompanyBio } from "@/app/components/companies/company-bio-section";
import { CompanyHeroSection } from "@/app/components/companies/company-hero-section";
import { CompanyLoadingSpinner } from "@/app/components/companies/company-loading-spinner";
import { CompanySocialMediaAndContact } from "@/app/components/companies/profile-social-media-and-contact";
import { JobSummarySection } from "@/app/components/companies/job-summary-section";
import { getJobBalance } from "@/lib/contracts/jobManager";

export const revalidate = 0;

type CompanyProfilePageProps = {
  params: {
    userId: string;
  };
  searchParams: {
    id?: number;
  };
};

// Helper function to fetch company data from API
async function fetchCompanyData(userId: string) {
  const response = await fetch(`/api/companies/my-profile?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch company data: ${response.statusText}`);
  }
  return await response.json();
}

// Helper function to fetch company jobs from API
async function fetchCompanyJobs(userId: string) {
  const response = await fetch(`/api/companies/jobs?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch company jobs: ${response.statusText}`);
  }
  return await response.json();
}

// Helper function to fetch single job from API
async function fetchSingleJob(jobId: string) {
  const response = await fetch(`/api/companies/job-data?id=${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch single job: ${response.statusText}`);
  }
  return await response.json();
}

export default function CompanyProfilePage(context: CompanyProfilePageProps) {
  const { userId } = context.params;
  const { id: jobId } = context.searchParams;
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [singleJob, setSingleJob] = useState<any>(null);
  const [jobBalances, setJobBalances] = useState<{ [key: string]: number }>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to new job URL format if jobId is provided
  useEffect(() => {
    if (jobId) {
      router.replace(`/jobs/${jobId}`);
      return;
    }
  }, [jobId, router]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch company profile data with error handling
      try {
        const profileResult = await fetchCompanyData(userId);
        setProfileData(profileResult);
      } catch (error) {
        console.error("Failed to fetch company data:", error);
        setProfileData({});
      }

      // Fetch company jobs with error handling
      try {
        const jobsResult = await fetchCompanyJobs(userId);
        setJobs(jobsResult);
      } catch (error) {
        console.error("Failed to fetch company jobs:", error);
        setJobs([]);
      }

      // Fetch single job with error handling
      if (jobId) {
        try {
          const singleJobResult = await fetchSingleJob(jobId);
          setSingleJob(singleJobResult);
        } catch (error) {
          console.error("Failed to fetch single job:", error);
          setSingleJob(null);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId, jobId]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!singleJob) {
        setIsLoadingBalances(false);
        return;
      }

      try {
        setIsLoadingBalances(true);

        // Only fetch balance for featured job using block_id
        if (singleJob?.block_id) {
          const balance = await getJobBalance(singleJob.block_id.toString());
          setJobBalances({ [singleJob.id.toString()]: balance });
        }
      } catch (error) {
        console.error("Error fetching job balance:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [singleJob]);

  const {
    headline,
    designation,
    address: streetAddress,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    linkedin,
    twitter,
    github,
    stackoverflow,
    portfolio,
    image_url,
    user_id,
  } = profileData;

  if (isLoading) {
    return (
      <CompanyLoadingSpinner
        size="large"
        message="Loading company profile..."
        subMessage="Gathering the latest details"
      />
    );
  }

  return (
    <main className={styles.companyProfileMain}>
      {/* Enhanced Hero Section */}
      <CompanyHeroSection
        companyName={designation || "Company Name"}
        city={city || "City"}
        country={country || "Country"}
        imageUrl={image_url}
        headline={headline}
        jobCount={jobs.length}
        isVerified={true}
      />

      {/* Main Content Container */}
      <div className={styles.container}>
        {/* Two Column Layout */}
        <div className={styles.contentGrid}>
          {/* Main Column - 70% */}
          <div className={styles.mainColumn}>
            {/* Conditional Content Based on Job View */}
            {singleJob ? (
              /* Job Summary Section when viewing specific job */
              <JobSummarySection
                job={singleJob}
                balance={jobBalances[singleJob.id]}
                isLoadingBalance={isLoadingBalances}
                companyEmail={email}
                walletAddress={userId}
              />
            ) : (
              /* About Company Section when no specific job */
              <div className={styles.aboutSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.titlePill}>
                    <svg
                      className={styles.icon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span>About Company</span>
                  </div>
                </div>
                <div className={styles.bioContent}>
                  <CompanyBio text={headline} />
                </div>
              </div>
            )}

            {/* Enhanced Job Listings - Show when no specific job or all jobs when viewing job */}
            <div className={styles.jobSection}>
              <AnimatedJobSection
                jobs={jobs}
                featuredJob={singleJob}
                companyEmail={email}
                userId={userId}
                jobBalances={jobBalances}
                isLoadingBalances={isLoadingBalances}
                showAllJobs={!singleJob}
              />
            </div>
          </div>

          {/* Side Column - 30% */}
          <div className={styles.sideColumn}>
            {/* Connect With Us Section */}
            <div className={styles.connectSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.titlePill}>
                  <svg
                    className={styles.icon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  <span>Connect With Us</span>
                </div>
              </div>
              <div className={styles.connectContent}>
                <CompanySocialMediaAndContact
                  twitter={twitter}
                  linkedin={linkedin}
                  telegram={telegram}
                  github={github}
                  stackoverflow={stackoverflow}
                  portfolio={portfolio}
                  email={email}
                  phone_country_code={phone_country_code}
                  phone_number={phone_number}
                  streetAddress={streetAddress}
                  companyName={designation || "Company"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
