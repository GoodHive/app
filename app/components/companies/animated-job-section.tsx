"use client";

import { Card } from "@/app/components/card";
import { Briefcase, DollarSign, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./animated-job-section.module.scss";

interface Job {
  id: number;
  title: string;
  companyName: string;
  description: string;
  city: string;
  country: string;
  budget: number;
  projectType: string;
  skills: string[];
  image_url?: string;
  walletAddress: string;
  escrowAmount: number;
  postedAt: string;
  currency: string;
  duration?: string;
  typeEngagement?: string;
  jobType?: string;
  block_id?: string;
  user_id: string;
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
}

interface AnimatedJobSectionProps {
  jobs: Job[];
  featuredJob?: Job | null;
  companyEmail?: string;
  userId: string;
  jobBalances?: { [key: string]: number };
  isLoadingBalances?: boolean;
  className?: string;
  showAllJobs?: boolean;
}

export const AnimatedJobSection = ({
  jobs,
  featuredJob,
  companyEmail,
  userId,
  jobBalances = {},
  isLoadingBalances = false,
  className = "",
  showAllJobs = true,
}: AnimatedJobSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getRelativeTime = (postedAt: string) => {
    const now = new Date();
    const posted = new Date(postedAt);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0)
      return `Posted ${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
    if (diffMonths > 0)
      return `Posted ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
    if (diffDays > 0)
      return `Posted ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    if (diffHours > 0)
      return `Posted ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffMins > 0)
      return `Posted ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    return "Posted just now";
  };

  return (
    <div className={className}>
      {/* All Jobs Section */}
      {showAllJobs && (
        <div
          className={`${isVisible ? styles.fadeInUp + " " + styles.delay200 : "opacity-0"}`}
        >
          <div className={styles.jobsSectionPill}>
            <div className={styles.jobsHeaderPill}>
              <div className={styles.jobsTitlePill}>
                <Briefcase className={styles.pillIcon} />
                <span>All Open Positions</span>
              </div>
              <div className={styles.jobsCountPill}>
                {jobs.length}{" "}
                {jobs.length === 1 ? "opportunity" : "opportunities"}
              </div>
            </div>
            <div className={styles.jobsSubtitle}>
              Explore all available positions
            </div>

            {jobs.length > 0 ? (
              <div className={styles.jobsGridPill}>
                {jobs.map((job, index) => {
                  if (job.id === featuredJob?.id) return null;
                  return (
                    <div
                      key={job.id}
                      className={`${styles.jobCardContainer} ${styles.scaleIn} ${styles[`delay${(index % 5) * 100}`]}`}
                    >
                      <Card
                        uniqueId={userId}
                        talent={job.talent}
                        mentor={job.mentor}
                        recruiter={job.recruiter}
                        jobId={job.id}
                        blockId={job.block_id}
                        type="job"
                        title={job.title}
                        postedBy={job.companyName}
                        postedOn={getRelativeTime(job.postedAt)}
                        image={job.image_url || "/img/company_img.png"}
                        country={job.country}
                        city={job.city}
                        budget={job.budget}
                        projectType={job.projectType}
                        currency={job.currency}
                        description={job.description}
                        skills={job.skills}
                        buttonText="View Details"
                        walletAddress={job.walletAddress}
                        escrowAmount={job.escrowAmount}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.jobsEmptyState}>
                <div className={styles.emptyStatePill}>
                  <div className={styles.emptyIconPill}>
                    <Briefcase className={styles.emptyIcon} />
                  </div>

                  <h3 className={styles.emptyTitle}>No Active Positions</h3>
                  <p className={styles.emptyDescription}>
                    This company doesn't have any open positions at the moment.
                    <br />
                    <span className={styles.emptyCta}>
                      Check back soon for new opportunities!
                    </span>
                  </p>

                  <div className={styles.emptyActionPill}>
                    <Users className={styles.actionIcon} />
                    <span>Stay tuned for updates</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Jobs Section - when viewing specific job */}
      {featuredJob && (
        <div
          className={`${isVisible ? styles.fadeInUp + " " + styles.delay300 : "opacity-0"}`}
        >
          <div className={styles.otherJobsSection}>
            <h3 className={styles.otherJobsTitle}>Other Opportunities</h3>
            {jobs.filter((job) => job.id !== featuredJob.id).length > 0 ? (
              <div className={styles.otherJobsGrid}>
                {jobs
                  .filter((job) => job.id !== featuredJob.id)
                  .slice(0, 3)
                  .map((job) => (
                    <div key={job.id} className={styles.otherJobCard}>
                      <h4 className={styles.otherJobTitle}>{job.title}</h4>
                      <p className={styles.otherJobLocation}>
                        <MapPin className={styles.otherJobIcon} />
                        {job.city}, {job.country}
                      </p>
                      <p className={styles.otherJobBudget}>
                        <DollarSign className={styles.otherJobIcon} />$
                        {job.budget.toLocaleString()} {job.currency}
                      </p>
                      <a
                        href={`/jobs/${job.id}`}
                        className={styles.otherJobLink}
                      >
                        View Details →
                      </a>
                    </div>
                  ))}
              </div>
            ) : (
              <p className={styles.noOtherJobs}>
                No other positions available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
