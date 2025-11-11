"use client";

import { MapPin, Clock, DollarSign, Calendar, Building, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { JobApplicationPopup } from "@/app/components/job-application-popup/job-application-popup";
import OnboardingPopup from "@/app/components/onboarding-popup/OnboardingPopup";
import TalentVerificationPopup from "@/app/components/talent-verification-popup/TalentVerificationPopup";
import styles from "./job-summary-section.module.scss";

interface JobSummaryProps {
  job: {
    id: number;
    title: string;
    companyName: string;
    description?: string;
    city: string;
    country: string;
    budget: number;
    currency: string;
    projectType: string;
    skills: string[];
    duration?: string;
    typeEngagement?: string;
    jobType?: string;
    createdAt: string;
    sections?: Array<{
      id: string;
      job_id: string;
      heading: string;
      content: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
    }>;
  };
  balance?: number;
  isLoadingBalance?: boolean;
  companyEmail?: string;
  walletAddress?: string;
}

export const JobSummarySection = ({
  job,
  balance,
  isLoadingBalance = false,
  companyEmail = "",
  walletAddress = ""
}: JobSummaryProps) => {
  const { user, isAuthenticated } = useAuth();
  const [isApplicationPopupOpen, setIsApplicationPopupOpen] = useState(false);
  const [isVerificationPopupOpen, setIsVerificationPopupOpen] = useState(false);
  const [isOnboardingPopupOpen, setIsOnboardingPopupOpen] = useState(false);

  // Debug logging to check what data we're receiving
  console.log('JobSummarySection job data:', job);
  console.log('Job sections:', job.sections);
  const getRelativeTime = (createdAt: string) => {
    const now = new Date();
    const posted = new Date(createdAt);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatBudget = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDC' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApplyClick = () => {
    // Check if user is authenticated and has verified talent status
    if (isAuthenticated && user && user.talent_status === "approved") {
      setIsApplicationPopupOpen(true);
    } else {
      // Show verification popup for unverified or unauthenticated users
      setIsVerificationPopupOpen(true);
    }
  };

  const handleContinueToOnboarding = () => {
    setIsVerificationPopupOpen(false);
    setIsOnboardingPopupOpen(true);
  };

  return (
    <div className={styles.jobSummary}>
      {/* Job Header */}
      <div className={styles.jobHeader}>
        <h1 className={styles.jobTitle}>{job.title}</h1>
        <div className={styles.jobMeta}>
          <div className={styles.metaItem}>
            <MapPin className={styles.metaIcon} />
            <span>{job.city}, {job.country}</span>
          </div>
          <div className={styles.metaItem}>
            <Building className={styles.metaIcon} />
            <span>{job.projectType}</span>
          </div>
          {job.duration && (
            <div className={styles.metaItem}>
              <Clock className={styles.metaIcon} />
              <span>{job.duration}</span>
            </div>
          )}
          <div className={styles.metaItem}>
            <Calendar className={styles.metaIcon} />
            <span>{getRelativeTime(job.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Job Details Grid */}
      <div className={styles.jobDetails}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Budget</div>
            <div className={styles.detailValue}>
              <DollarSign className={styles.valueIcon} />
              {formatBudget(job.budget, job.currency)}
            </div>
          </div>

          {job.jobType && (
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Job Type</div>
              <div className={styles.detailValue}>{job.jobType}</div>
            </div>
          )}

          {job.typeEngagement && (
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Engagement</div>
              <div className={styles.detailValue}>{job.typeEngagement}</div>
            </div>
          )}

          {balance !== undefined && (
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Escrow Balance</div>
              <div className={styles.detailValue}>
                {isLoadingBalance ? (
                  <div className={styles.balanceLoading}>Loading...</div>
                ) : (
                  <span className={styles.balanceAmount}>
                    ${balance?.toFixed(2) || "0.00"} USDC
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      {job.skills && job.skills.length > 0 && (
        <div className={styles.skillsSection}>
          <h3 className={styles.skillsTitle}>Skills & Expertise</h3>
          <div className={styles.skillsTags}>
            {job.skills.map((skill, index) => (
              <span key={index} className={styles.skillTag}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job Description */}
      <div className={styles.descriptionSection}>
        <h2 className={styles.sectionTitle}>Job Description</h2>

        {job.sections && job.sections.length > 0 ? (
          <div className={styles.jobSections}>
            {job.sections
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <div key={section.id} className={styles.jobSection}>
                  <h3 className={styles.sectionHeading}>{section.heading}</h3>
                  <div
                    className={styles.sectionContent}
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className={styles.jobDescription}>
            <p>{job.description}</p>
          </div>
        )}
      </div>

      {/* Apply Section */}
      <div className={styles.applySection}>
        <button className={styles.applyButton} onClick={handleApplyClick}>
          <Users className={styles.applyIcon} />
          Apply for this position
        </button>
        <p className={styles.applyText}>
          Join our team and help us build something amazing together.
        </p>
      </div>

      {/* Talent Verification Popup */}
      {isVerificationPopupOpen && (
        <TalentVerificationPopup
          isOpen={isVerificationPopupOpen}
          onClose={() => setIsVerificationPopupOpen(false)}
          onContinueToOnboarding={handleContinueToOnboarding}
          jobTitle={job.title}
          companyName={job.companyName}
        />
      )}

      {/* Job Application Popup */}
      {isApplicationPopupOpen && companyEmail && walletAddress && (
        <JobApplicationPopup
          isOpen={isApplicationPopupOpen}
          onClose={() => setIsApplicationPopupOpen(false)}
          jobTitle={job.title}
          companyName={job.companyName}
          companyEmail={companyEmail}
          jobId={job.id}
          walletAddress={walletAddress}
        />
      )}

      {/* Onboarding Popup */}
      {isOnboardingPopupOpen && (
        <OnboardingPopup
          isOpen={isOnboardingPopupOpen}
          onClose={() => setIsOnboardingPopupOpen(false)}
          onContinue={() => {
            setIsOnboardingPopupOpen(false);
            // User will be redirected to profile creation via the onboarding component
          }}
        />
      )}
    </div>
  );
};