"use client";

import clsx from "clsx";
import {
  ArrowRight,
  Building2,
  Crown,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";

import { TRANSLATION, allServices } from "./services.constants";
import styles from "./services.module.scss";

type IndicatorState = {
  width: number;
  left: number;
};

export const Services = () => {
  const router = useRouter();
  const { navigate: protectedNavigate } = useProtectedNavigation();
  const { isAuthenticated, checkAuthAndShowConnectPrompt } = useAuthCheck();
  const [activeTab, setActiveTab] = useState("talent");

  const getButtonText = (id: string) => {
    if (!isAuthenticated) {
      return "Create your profile";
    }

    if (id === "talent") {
      return "Visit your talent profile";
    }

    if (id === "companies") {
      return "Visit your company profile";
    }

    return "Create your profile";
  };

  const onCtaClickHandler = (id: string) => {
    if (!isAuthenticated) {
      checkAuthAndShowConnectPrompt("access this feature", "service-action", { serviceType: id });
      return;
    }

    if (id === "talent") {
      return router.push("/talents/my-profile");
    } else if (id === "companies") {
      return router.push("/companies/my-profile");
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.background} aria-hidden>
        <div className={clsx(styles.hexagon, styles.hexagonTop)} />
        <div className={clsx(styles.hexagon, styles.hexagonBottom)} />

        <span className={clsx(styles.bee, styles.beeLarge)}>🐝</span>
        <span className={clsx(styles.bee, styles.beeSmall)}>🐝</span>
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>
            <Crown size={16} />
            Benefits
          </div>

          <h1 className={styles.title}>
            <span>Why Choose</span>
            <span className={styles.titleHighlight}>GoodHive</span>
          </h1>

          <p className={styles.description}>{TRANSLATION.description}</p>
        </header>

        <div className={styles.tabNavigation}>
          <div className={styles.tabContainer}>
            {allServices.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveTab(service.id)}
                className={clsx(
                  styles.tabButton,
                  activeTab === service.id
                    ? service.id === "talent"
                      ? styles.activeTalent
                      : styles.activeCompany
                    : styles.inactive
                )}
              >
                {service.id === "talent" ? "For Job Seekers / Talent" : "For Companies / Recruiter"}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.cardsContainer}>
          {allServices.map((service) => {
            const { id, title, description } = service;
            const isForTalent = id === "talent";
            const Icon = isForTalent ? Users : Building2;
            const isActive = id === activeTab;

            return (
              <div
                key={id}
                className={clsx(
                  styles.serviceSection,
                  isActive ? styles.active : styles.inactive
                )}
              >
                <div className={clsx(styles.serviceCard, isForTalent ? styles.talent : styles.company)}>
                  <div className={styles.cardFloatingParticles}>
                    <div className={clsx(styles.particle, styles.particle1)}>✨</div>
                    <div className={clsx(styles.particle, styles.particle2)}>⭐</div>
                    <div className={clsx(styles.particle, styles.particle3)}>💫</div>
                  </div>

                  <div className={styles.cardHeader}>
                    <div className={styles.iconSection}>
                      <div className={clsx(styles.iconContainer, isForTalent ? styles.talent : styles.company)}>
                        <Icon />
                      </div>
                    </div>
                    <div className={styles.headerText}>
                      <h3 className={styles.cardTitle}>{title}</h3>
                      <p className={styles.cardDescription}>{description}</p>
                    </div>
                  </div>

                  <div className={styles.featuresList}>
                    {isForTalent ? (
                      <>
                        <div className={styles.featureItem}>
                          <div className={clsx(styles.featureIcon, styles.talent)}>
                            <Star />
                          </div>
                          <span>100% commission returned</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={clsx(styles.featureIcon, styles.talent)}>
                            <Trophy />
                          </div>
                          <span>Co-own your platform</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={clsx(styles.featureIcon, styles.talent)}>
                            <Zap />
                          </div>
                          <span>Earn as recruiter & mentor</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.featureItem}>
                          <div className={clsx(styles.featureIcon, styles.company)}>
                            <Star />
                          </div>
                          <span>Stake-backed recruiters</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={clsx(styles.featureIcon, styles.company)}>
                            <Trophy />
                          </div>
                          <span>Community mentoring</span>
                        </div>
                        <div className={styles.featureItem}>
                          <div className={clsx(styles.featureIcon, styles.company)}>
                            <Zap />
                          </div>
                          <span>Excellence rewards</span>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onCtaClickHandler(id)}
                    className={clsx(styles.ctaButton, isForTalent ? styles.talent : styles.company)}
                  >
                    <span className={styles.buttonContent}>
                      <span>{getButtonText(id)}</span>
                      <ArrowRight />
                    </span>
                  </button>
                </div>

                <div className={clsx(styles.videoCard, isForTalent ? styles.talent : styles.company)}>
                  <div className={styles.cardFloatingParticles}>
                    <div className={clsx(styles.particle, styles.particle1)}>🎥</div>
                    <div className={clsx(styles.particle, styles.particle2)}>🎬</div>
                    <div className={clsx(styles.particle, styles.particle3)}>📺</div>
                  </div>

                  <div className={styles.videoHeader}>
                    <h4 className={styles.videoTitle}>Platform Overview</h4>
                    <p className={styles.videoSubtitle}>See how GoodHive works</p>
                  </div>
                  <div className={styles.videoContainer}>
                    <iframe
                      src="https://www.youtube.com/embed/4ep_oZ0khzo"
                      title="GoodHive Platform Overview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className={styles.videoEmbed}
                    ></iframe>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.bottomCta}>
          <div className={styles.bottomBadge}>
            <Sparkles className={styles.sparkleIcon} />
            <span>Join the community in Web3! 🍯</span>
          </div>
        </div>
      </div>
    </section>
  );
};
