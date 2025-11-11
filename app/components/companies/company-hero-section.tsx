"use client";

import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { Sparkles, MapPin, Users, Briefcase } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./company-hero-section.module.scss";

interface CompanyHeroSectionProps {
  companyName: string;
  city: string;
  country: string;
  imageUrl?: string;
  headline?: string;
  jobCount?: number;
  isVerified?: boolean;
}

export const CompanyHeroSection = ({
  companyName,
  city,
  country,
  imageUrl,
  headline,
  jobCount = 0,
  isVerified = false,
}: CompanyHeroSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={styles.heroSection}>
      {/* Animated Background Elements */}
      <div className={styles.backgroundContainer}>
        {/* Enhanced Honeycomb Pattern */}
        <div className={styles.honeycombPattern}>
          <svg className={styles.honeycombSvg} viewBox="0 0 100 100">
            <defs>
              <pattern
                id="honeycomb-hero"
                x="0"
                y="0"
                width="20"
                height="17.32"
                patternUnits="userSpaceOnUse"
              >
                <polygon
                  points="10,0 20,5.77 20,11.55 10,17.32 0,11.55 0,5.77"
                  className={styles.honeycombPolygon}
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#honeycomb-hero)" />
          </svg>
        </div>

        {/* Floating Bee Particles */}
        <div className={styles.floatingParticles}>
          <div className={styles.particle1}>
            <div className={`${styles.beeParticle} ${styles.delay100}`}></div>
          </div>
          <div className={styles.particle2}>
            <div className={`${styles.beeParticle} ${styles.slow} ${styles.delay300}`}></div>
          </div>
          <div className={styles.particle3}>
            <div className={`${styles.beeParticle} ${styles.delay500}`}></div>
          </div>
        </div>

        {/* Animated Bees */}
        <div className={styles.animatedBees}>
          <div className={styles.bee1}>
            <span className={styles.beeEmoji}>🐝</span>
          </div>
          <div className={styles.bee2}>
            <span className={styles.beeEmoji}>🐝</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className={styles.gradientOverlay}></div>
      </div>

      {/* Hero Content */}
      <div className={styles.heroContent}>
        {/* Company Information */}
        <div className={styles.companyInfo}>
          {/* Company Logo and Name */}
          <div
            className={`${styles.companyHeader} ${
              isVisible ? styles.visible : styles.hidden
            }`}
          >
            <div className={styles.logoContainer}>
              <div className={styles.logoWrapper}>
                <Image
                  className={styles.logoImage}
                  src={imageUrl || "/img/placeholder-image.png"}
                  alt={`${companyName} logo`}
                  fill
                />
              </div>
              {/* Verification Badge */}
              {isVerified && (
                <div className={styles.verificationBadge}>
                  <span className={styles.checkIcon}>✓</span>
                </div>
              )}
              {/* Decorative bee icon */}
              <div className={styles.decorativeBee}>
                <span className={styles.beeIcon}>🐝</span>
              </div>
            </div>

            <div className={styles.titleSection}>
              <h1 className={styles.companyName}>
                {companyName}
              </h1>

              <div className={styles.locationSection}>
                <div className={styles.countryBadge}>
                  <div className={styles.flagContainer}>
                    <Image
                      src={generateCountryFlag(country) as string}
                      alt={`${country} flag`}
                      fill
                      className={styles.flagImage}
                    />
                  </div>
                  <span className={styles.countryName}>
                    {country}
                  </span>
                </div>
                <MapPin className={styles.mapIcon} />
                <span className={styles.cityName}>
                  {city}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className={`${styles.quickStats} ${
              isVisible ? styles.visible : styles.hidden
            }`}
          >
            <div className={styles.statBadge}>
              <Briefcase className={styles.jobIcon} />
              <span className={styles.statText}>
                {jobCount} Active {jobCount === 1 ? 'Job' : 'Jobs'}
              </span>
            </div>

            {isVerified && (
              <div className={`${styles.statBadge} ${styles.verified}`}>
                <Sparkles className={styles.verifiedIcon} />
                <span className={styles.verifiedText}>Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className={styles.decorativeElements}>
          {/* Large Animated Bee */}
          <div
            className={`${styles.mascotContainer} ${
              isVisible ? styles.visible : styles.hidden
            }`}
          >
            <div className={styles.glowBackground}></div>
            <div className={styles.mascotWrapper}>
              <Image
                alt="Company mascot bee"
                src="/img/client-bee.png"
                fill={true}
                className={styles.mascotImage}
              />
            </div>
            {/* Floating particles around the bee */}
            <div className={styles.floatingTrails}>
              <div className={styles.trail1}>
                <div className={styles.trailParticle}></div>
              </div>
              <div className={styles.trail2}>
                <div className={styles.trailParticle}></div>
              </div>
              <div className={styles.trail3}>
                <div className={styles.trailParticle}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Decorative Wave */}
      <div className={styles.bottomWave}>
        <svg
          className={styles.waveSvg}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};