"use client";

import Link from "next/link";
import {
  ABOUT_CONTENT,
  IMPACT_METRICS,
  JOURNEY_MOMENTS,
  TEAM_MEMBERS,
  VALUE_PILLARS,
  VIDEO_CONFIG,
} from "./about-us.constants";
import styles from "./about-us.module.scss";

export default function AboutUsPage() {
  return (
    <div className={styles.aboutPage}>
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={`${styles.heroBlob} ${styles.heroBlobOne}`} />
          <div className={`${styles.heroBlob} ${styles.heroBlobTwo}`} />
          <div className={`${styles.heroGridlines}`} />
        </div>

        <div className={styles.container}>
          <div className={styles.heroLayout}>
            <div className={styles.heroContent}>
              <span className={styles.subtitleBadge}>
                {ABOUT_CONTENT.hero.subtitle}
              </span>
              <h1 className={styles.heroTitle}>
                {ABOUT_CONTENT.hero.title}
                <span className={styles.titleAccent}>
                  {" "}
                  for builders who lead with trust.
                </span>
              </h1>
              <p className={styles.heroDescription}>
                {ABOUT_CONTENT.hero.description}
              </p>

              <div className={styles.heroActions}>
                <Link href="/contact" className={styles.primaryButton}>
                  Talk to our team
                </Link>
                <Link href="/companies" className={styles.secondaryButton}>
                  Explore the platform
                </Link>
              </div>

              <div className={styles.metricRow}>
                {IMPACT_METRICS.map((metric) => (
                  <div key={metric.id} className={styles.metricCard}>
                    <span className={styles.metricValue}>{metric.value}</span>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <p className={styles.metricDescription}>
                      {metric.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroMedia}>
              <div className={styles.mediaCard}>
                <div className={styles.mediaHeader}>
                  <span className={styles.mediaTag}>
                    Watch GoodHive in action
                  </span>
                  <span className={styles.mediaPulse} />
                </div>
                <div className={styles.mediaFrame}>
                  <iframe
                    src={VIDEO_CONFIG.embedUrl}
                    title={VIDEO_CONFIG.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className={styles.mediaFooter}>
                  <div className={styles.trustPill}>
                    <span className={styles.pillDot} />
                    Trusted by teams scaling decentralized products
                  </div>
                  <div className={styles.avatarStack}>
                    {new Array(5).fill(null).map((_, index) => (
                      <span
                        key={`avatar-circle-${index}`}
                        className={styles.avatarCircle}
                      >
                        GH
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Why GoodHive</span>
            <h2 className={styles.sectionTitle}>
              A platform shaped by our values
            </h2>
            <p className={styles.sectionDescription}>
              We align incentives between talent, companies, and the broader
              ecosystem by staying grounded in principles that keep the network
              healthy.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            {VALUE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.id} className={styles.valueCard}>
                  <div className={styles.valueHoneycomb}>
                    <div className={styles.valueHexagon} />
                    <div className={styles.valueHexagon} />
                  </div>
                  <div className={styles.valueIcon}>
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className={styles.valueTitle}>{pillar.title}</h3>
                  <p className={styles.valueDescription}>
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.journeySection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Our Journey</span>
            <h2 className={styles.sectionTitle}>
              From idea to thriving ecosystem
            </h2>
            <p className={styles.sectionDescription}>
              GoodHive keeps shipping new primitives for the future of work.
              Here&rsquo;s a snapshot of how we got here.
            </p>
          </div>

          <div className={styles.timeline}>
            {JOURNEY_MOMENTS.map((moment, index) => (
              <div key={moment.id} className={styles.timelineItem}>
                <div className={styles.timelineContent}>
                  <div className={styles.honeycombDecor}>
                    <div className={styles.hexagon} />
                    <div className={styles.hexagon} />
                    <div className={styles.hexagon} />
                  </div>
                  <div className={styles.timelineLabel}>{moment.label}</div>
                  <h3 className={styles.timelineTitle}>{moment.title}</h3>
                  <p className={styles.timelineDescription}>
                    {moment.description}
                  </p>
                  <div className={styles.timelineYear}>{moment.year}</div>
                </div>
                <div className={styles.timelineMarker}>
                  <div className={styles.timelineDot} />
                  {index !== JOURNEY_MOMENTS.length - 1 && (
                    <div className={styles.timelineConnector} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.teamSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>The Team</span>
            <h2 className={styles.sectionTitle}>
              Meet the people shaping the hive
            </h2>
            <p className={styles.sectionDescription}>
              From product strategy to research and engineering, our team blends
              experience from leading Web2 and Web3 companies with a bias for
              action.
            </p>
          </div>

          <div className={styles.teamGrid}>
            {TEAM_MEMBERS.map((member) => (
              <article key={member.id} className={styles.teamCard}>
                <div className={styles.teamPortrait}>
                  <span className={styles.teamInitials}>
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join("")}
                  </span>
                  <div className={styles.portraitGlow} />
                </div>
                <div className={styles.teamCopy}>
                  <h3 className={styles.teamName}>{member.name}</h3>
                  <p className={styles.teamRole}>{member.role}</p>
                  <p className={styles.teamBio}>{member.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
