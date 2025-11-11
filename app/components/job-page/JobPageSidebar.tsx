"use client";

import { MapPin, DollarSign, Clock, Calendar, Building, Users, Globe, Linkedin, Twitter, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./JobPageSidebar.module.scss";

interface JobPageSidebarProps {
  job: {
    id: string;
    budget: number;
    currency: string;
    projectType: string;
    typeEngagement?: string;
    duration?: string;
    postedAt: string;
    applicationCount?: number;
    company: {
      id: string;
      name: string;
      logo?: string;
      headline?: string;
      city?: string;
      country?: string;
      email?: string;
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
}

export const JobPageSidebar = ({ job }: JobPageSidebarProps) => {
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const posted = new Date(dateString);
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

  return (
    <div className={styles.sidebarContainer}>
      {/* Job Details Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Job Details</h3>
        <div className={styles.detailsList}>
          <div className={styles.detailItem}>
            <DollarSign className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Budget</span>
              <span className={styles.detailValue}>
                {formatBudget(job.budget, job.currency)}
              </span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Building className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Project Type</span>
              <span className={styles.detailValue}>{job.projectType}</span>
            </div>
          </div>

          {job.typeEngagement && (
            <div className={styles.detailItem}>
              <Clock className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Engagement</span>
                <span className={styles.detailValue}>{job.typeEngagement}</span>
              </div>
            </div>
          )}

          {job.duration && (
            <div className={styles.detailItem}>
              <Calendar className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Duration</span>
                <span className={styles.detailValue}>{job.duration}</span>
              </div>
            </div>
          )}

          <div className={styles.detailItem}>
            <Calendar className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Posted</span>
              <span className={styles.detailValue}>
                {getRelativeTime(job.postedAt)}
              </span>
            </div>
          </div>

          {job.applicationCount !== undefined && (
            <div className={styles.detailItem}>
              <Users className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Applications</span>
                <span className={styles.detailValue}>
                  {job.applicationCount} applicants
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Company Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>About the Company</h3>

        <div className={styles.companyHeader}>
          <div className={styles.companyLogo}>
            {job.company.logo ? (
              <Image
                src={job.company.logo}
                alt={`${job.company.name} logo`}
                width={48}
                height={48}
                className={styles.logoImage}
              />
            ) : (
              <div className={styles.logoPlaceholder}>
                <Building size={24} />
              </div>
            )}
          </div>
          <div className={styles.companyInfo}>
            <Link href={`/companies/${job.company.id}`} className={styles.companyName}>
              {job.company.name}
            </Link>
            {job.company.headline && (
              <p className={styles.companyHeadline}>{job.company.headline}</p>
            )}
          </div>
        </div>

        {(job.company.city || job.company.country) && (
          <div className={styles.companyDetail}>
            <MapPin className={styles.detailIcon} />
            <span>
              {job.company.city && job.company.country
                ? `${job.company.city}, ${job.company.country}`
                : job.company.city || job.company.country}
            </span>
          </div>
        )}

        {/* Company Links */}
        {(job.company.website || job.company.linkedin || job.company.twitter || job.company.email) && (
          <div className={styles.companyLinks}>
            {job.company.website && (
              <a
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.companyLink}
              >
                <Globe size={16} />
                Website
              </a>
            )}
            {job.company.linkedin && (
              <a
                href={job.company.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.companyLink}
              >
                <Linkedin size={16} />
                LinkedIn
              </a>
            )}
            {job.company.twitter && (
              <a
                href={job.company.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.companyLink}
              >
                <Twitter size={16} />
                Twitter
              </a>
            )}
            {job.company.email && (
              <a
                href={`mailto:${job.company.email}`}
                className={styles.companyLink}
              >
                <Mail size={16} />
                Contact
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};