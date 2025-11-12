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
              <div
                className={styles.companyHeadline}
                dangerouslySetInnerHTML={{ __html: job.company.headline }}
              />
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

        {/* Enhanced Company Contact Information */}
        {(job.company.website || job.company.linkedin || job.company.twitter || job.company.email) && (
          <div className={styles.companyContactSection}>
            <h4 className={styles.contactSubtitle}>Connect with {job.company.name}</h4>
            <div className={styles.contactGrid}>
              {job.company.email && (
                <div className={styles.contactItem}>
                  <Mail className={styles.contactIcon} />
                  <a href={`mailto:${job.company.email}`} className={styles.contactLink}>
                    {job.company.email}
                  </a>
                </div>
              )}

              {job.company.website && (
                <div className={styles.contactItem}>
                  <Globe className={styles.contactIcon} />
                  <a href={job.company.website} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                    {job.company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {job.company.linkedin && (
                <div className={styles.contactItem}>
                  <Linkedin className={styles.contactIcon} />
                  <a href={job.company.linkedin} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                    LinkedIn Profile
                  </a>
                </div>
              )}

              {job.company.twitter && (
                <div className={styles.contactItem}>
                  <Twitter className={styles.contactIcon} />
                  <a href={job.company.twitter} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                    @{job.company.twitter.split('/').pop()}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Follow Our Journey Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Follow Our Journey</h3>
        <div className={styles.journeyContent}>
          <p className={styles.journeyText}>Stay updated with our latest developments and opportunities</p>
        </div>
      </div>

      {/* Get in Touch Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Get in Touch</h3>
        <div className={styles.accessRestricted}>
          <div className={styles.restrictedContent}>
            <h4 className={styles.restrictedTitle}>Access Restricted</h4>
            <p className={styles.restrictedText}>Contact details are available to validated talents.</p>
          </div>
        </div>
      </div>

      {/* Contact GoodHive Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Contact GoodHive</h3>
        <div className={styles.contactGoodHive}>
          <p className={styles.contactDescription}>
            Have questions about {job.company.name}? Send us a message and we'll help you connect!
          </p>
          <button className={styles.sendMessageButton}>
            <Mail className={styles.buttonIcon} />
            Send us a Message
          </button>
        </div>
      </div>
    </div>
  );
};