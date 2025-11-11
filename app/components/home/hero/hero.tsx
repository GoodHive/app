"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { GoodhiveQuestLink } from "@/app/constants/common";
import styles from "./hero.module.scss";

export const Hero = () => {
  const router = useRouter();

  const onFindJobBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/talents/job-search");
  };

  const onFindTalentBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push("/companies/search-talents");
  };

  const onJoinQuestsClickHandler = () => {
    window.open(GoodhiveQuestLink, "_blank");
  };

  return (
    <section className={styles.hero}>
      {/* Minimalist Background with Subtle Gradient */}
      <div className={styles.background} />

      {/* Subtle Honeycomb Pattern Overlay */}
      <div className={styles.honeycombPattern} />

      {/* Top-Left Hexagon Cluster - Modern Design */}
      <div className={styles.topLeftCluster}>
        <svg className="w-[450px] h-[450px]" viewBox="0 0 450 450">
          <defs>
            <linearGradient
              id="hexGradient1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient
              id="hexGradient2"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Large main hexagon - outlined */}
          <polygon
            points="200,80 280,125 280,215 200,260 120,215 120,125"
            fill="none"
            stroke="#d97706"
            strokeWidth="2.5"
            opacity="0.3"
            strokeDasharray="5 3"
          />

          {/* Large filled hexagon with gradient */}
          <polygon
            points="150,150 210,185 210,255 150,290 90,255 90,185"
            fill="url(#hexGradient1)"
            stroke="#f59e0b"
            strokeWidth="1.5"
            opacity="0.25"
          />

          {/* Medium hexagon - top */}
          <polygon
            points="280,60 320,82 320,126 280,148 240,126 240,82"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.35"
          />

          {/* Medium hexagon - center right */}
          <polygon
            points="320,180 360,202 360,246 320,268 280,246 280,202"
            fill="url(#hexGradient2)"
            stroke="#d97706"
            strokeWidth="1.8"
            opacity="0.2"
          />

          {/* Small accent hexagons */}
          <polygon
            points="100,100 125,113 125,139 100,152 75,139 75,113"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            opacity="0.4"
            strokeDasharray="3 2"
          />

          <polygon
            points="240,280 265,293 265,319 240,332 215,319 215,293"
            fill="#fbbf24"
            fillOpacity="0.1"
            stroke="#d97706"
            strokeWidth="1.2"
            opacity="0.3"
          />

          {/* Tiny floating hexagons */}
          <polygon
            points="350,120 365,128 365,144 350,152 335,144 335,128"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="1"
            opacity="0.5"
          />

          <polygon
            points="60,240 75,248 75,264 60,272 45,264 45,248"
            fill="#f59e0b"
            fillOpacity="0.15"
            opacity="0.35"
          />

          <polygon
            points="180,350 195,358 195,374 180,382 165,374 165,358"
            fill="none"
            stroke="#d97706"
            strokeWidth="0.8"
            opacity="0.3"
            strokeDasharray="2 2"
          />
        </svg>
      </div>

      {/* Top-Right Hexagon Cluster - Bigger Design */}
      <div className={styles.topRightCluster}>
        <svg className="w-[400px] h-[400px]" viewBox="0 0 400 400">
          <defs>
            <linearGradient
              id="hexGradient5"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient
              id="hexGradient6"
              x1="100%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Large hexagon - top right */}
          <polygon
            points="260,70 320,100 320,180 260,210 200,180 200,100"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            opacity="0.25"
            strokeDasharray="5 3"
          />

          {/* Large filled hexagon */}
          <polygon
            points="200,130 260,160 260,240 200,270 140,240 140,160"
            fill="url(#hexGradient5)"
            stroke="#d97706"
            strokeWidth="1.8"
            opacity="0.2"
          />

          {/* Medium hexagon - center */}
          <polygon
            points="300,200 340,220 340,280 300,300 260,280 260,220"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.3"
          />

          {/* Medium filled hexagon */}
          <polygon
            points="160,240 200,260 200,320 160,340 120,320 120,260"
            fill="url(#hexGradient6)"
            stroke="#f59e0b"
            strokeWidth="1.5"
            opacity="0.18"
          />

          {/* Small accent hexagons */}
          <polygon
            points="100,160 140,180 140,220 100,240 60,220 60,180"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="1.2"
            opacity="0.4"
            strokeDasharray="3 2"
          />

          <polygon
            points="320,120 360,140 360,180 320,200 280,180 280,140"
            fill="#f59e0b"
            fillOpacity="0.08"
            stroke="#d97706"
            strokeWidth="1.2"
            opacity="0.25"
          />

          {/* Extra small hexagons */}
          <polygon
            points="240,300 260,310 260,330 240,340 220,330 220,310"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1"
            opacity="0.3"
          />

          <polygon
            points="80,280 100,290 100,310 80,320 60,310 60,290"
            fill="#fcd34d"
            fillOpacity="0.1"
            opacity="0.2"
          />

          {/* Tiny floating hexagons */}
          <polygon
            points="340,60 360,70 360,90 340,100 320,90 320,70"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.8"
            opacity="0.35"
          />

          <polygon
            points="60,120 80,130 80,150 60,160 40,150 40,130"
            fill="#fbbf24"
            fillOpacity="0.06"
            opacity="0.25"
          />
        </svg>
      </div>

      {/* Bottom-Left Hexagon Cluster - Medium Design */}
      <div className={styles.bottomLeftCluster}>
        <svg className="w-[350px] h-[350px]" viewBox="0 0 350 350">
          <defs>
            <linearGradient
              id="hexGradient7"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient
              id="hexGradient8"
              x1="100%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Large hexagon - bottom left */}
          <polygon
            points="200,280 260,310 260,390 200,420 140,390 140,310"
            fill="none"
            stroke="#d97706"
            strokeWidth="2.2"
            opacity="0.22"
            strokeDasharray="4 3"
          />

          {/* Large filled hexagon */}
          <polygon
            points="150,200 210,230 210,310 150,340 90,310 90,230"
            fill="url(#hexGradient7)"
            stroke="#f59e0b"
            strokeWidth="1.6"
            opacity="0.18"
          />

          {/* Medium hexagon - center */}
          <polygon
            points="250,150 290,170 290,230 250,250 210,230 210,170"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.8"
            opacity="0.28"
          />

          {/* Medium filled hexagon */}
          <polygon
            points="100,250 140,270 140,330 100,350 60,330 60,270"
            fill="url(#hexGradient8)"
            stroke="#d97706"
            strokeWidth="1.4"
            opacity="0.16"
          />

          {/* Small accent hexagons */}
          <polygon
            points="80,180 120,200 120,260 80,280 40,260 40,200"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="1.2"
            opacity="0.35"
            strokeDasharray="3 2"
          />

          <polygon
            points="280,280 320,300 320,360 280,380 240,360 240,300"
            fill="#f59e0b"
            fillOpacity="0.06"
            stroke="#fbbf24"
            strokeWidth="1.1"
            opacity="0.22"
          />

          {/* Extra small hexagons */}
          <polygon
            points="200,120 220,130 220,150 200,160 180,150 180,130"
            fill="none"
            stroke="#d97706"
            strokeWidth="1"
            opacity="0.3"
          />

          <polygon
            points="60,320 80,330 80,350 60,360 40,350 40,330"
            fill="#fbbf24"
            fillOpacity="0.08"
            opacity="0.2"
          />

          {/* Tiny floating hexagons */}
          <polygon
            points="300,80 320,90 320,110 300,120 280,110 280,90"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.8"
            opacity="0.32"
          />

          <polygon
            points="40,140 60,150 60,170 40,180 20,170 20,150"
            fill="#fcd34d"
            fillOpacity="0.05"
            opacity="0.18"
          />
        </svg>
      </div>

      {/* Bottom-Right Hexagon Cluster - Modern Design */}
      <div className={styles.bottomRightCluster}>
        <svg className="w-[500px] h-[500px]" viewBox="0 0 500 500">
          <defs>
            <linearGradient
              id="hexGradient3"
              x1="100%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient
              id="hexGradient4"
              x1="100%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Large main hexagon - outlined with dash */}
          <polygon
            points="300,240 380,285 380,375 300,420 220,375 220,285"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            opacity="0.3"
            strokeDasharray="6 4"
          />

          {/* Large filled hexagon with gradient */}
          <polygon
            points="350,170 410,205 410,275 350,310 290,275 290,205"
            fill="url(#hexGradient3)"
            stroke="#d97706"
            strokeWidth="1.8"
            opacity="0.22"
          />

          {/* Medium hexagon - bottom */}
          <polygon
            points="220,380 260,402 260,446 220,468 180,446 180,402"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.35"
          />

          {/* Medium hexagon - center left */}
          <polygon
            points="180,250 220,272 220,316 180,338 140,316 140,272"
            fill="url(#hexGradient4)"
            stroke="#f59e0b"
            strokeWidth="1.5"
            opacity="0.25"
          />

          {/* Small accent hexagons */}
          <polygon
            points="400,350 425,363 425,389 400,402 375,389 375,363"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.5"
            opacity="0.4"
            strokeDasharray="3 2"
          />

          <polygon
            points="260,180 285,193 285,219 260,232 235,219 235,193"
            fill="#fcd34d"
            fillOpacity="0.12"
            stroke="#f59e0b"
            strokeWidth="1.2"
            opacity="0.3"
          />

          {/* Tiny floating hexagons */}
          <polygon
            points="150,380 165,388 165,404 150,412 135,404 135,388"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1"
            opacity="0.45"
          />

          <polygon
            points="440,260 455,268 455,284 440,292 425,284 425,268"
            fill="#d97706"
            fillOpacity="0.1"
            opacity="0.35"
          />

          <polygon
            points="320,120 335,128 335,144 320,152 305,144 305,128"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="0.8"
            opacity="0.3"
            strokeDasharray="2 2"
          />

          {/* Extra small hexagon */}
          <polygon
            points="380,440 390,445 390,455 380,460 370,455 370,445"
            fill="#f59e0b"
            fillOpacity="0.2"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Additional scattered hexagons for depth */}
      <div className={styles.scatteredHexagons}>
        {/* Top center floating hexagon */}
        <div className={styles.topCenterHex}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            <polygon
              points="30,8 46,17 46,33 30,42 14,33 14,17"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.2"
              strokeDasharray="4 3"
            />
          </svg>
        </div>

        {/* Mid-left floating hexagon */}
        <div className={styles.midLeftHex}>
          <svg width="45" height="45" viewBox="0 0 45 45">
            <polygon
              points="22.5,6 36,13.5 36,27 22.5,34.5 9,27 9,13.5"
              fill="#fbbf24"
              fillOpacity="0.08"
              stroke="#d97706"
              strokeWidth="1.2"
              opacity="0.25"
            />
          </svg>
        </div>

        {/* Mid-right floating hexagon */}
        <div className={styles.midRightHex}>
          <svg width="50" height="50" viewBox="0 0 50 50">
            <polygon
              points="25,7 40,15.5 40,31 25,39.5 10,31 10,15.5"
              fill="none"
              stroke="#fcd34d"
              strokeWidth="1.8"
              opacity="0.18"
              strokeDasharray="3 2"
            />
          </svg>
        </div>

        {/* Bottom center hexagon */}
        <div className={styles.bottomCenterHex}>
          <svg width="55" height="55" viewBox="0 0 55 55">
            <polygon
              points="27.5,8 42.5,16.5 42.5,32 27.5,40.5 12.5,32 12.5,16.5"
              fill="#f59e0b"
              fillOpacity="0.06"
              stroke="#fbbf24"
              strokeWidth="1.5"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Small accent hexagon - top right */}
        <div className={styles.topRightHex}>
          <svg width="35" height="35" viewBox="0 0 35 35">
            <polygon
              points="17.5,5 27.5,10.5 27.5,20.5 17.5,26 7.5,20.5 7.5,10.5"
              fill="none"
              stroke="#d97706"
              strokeWidth="1"
              opacity="0.35"
            />
          </svg>
        </div>

        {/* Tiny hexagon - center */}
        <div className={styles.centerHex}>
          <svg width="30" height="30" viewBox="0 0 30 30">
            <polygon
              points="15,4 24,8.5 24,17.5 15,22 6,17.5 6,8.5"
              fill="#fcd34d"
              fillOpacity="0.1"
              opacity="0.25"
            />
          </svg>
        </div>

        {/* Extra tiny hexagon - bottom left */}
        <div className={styles.bottomLeftHex}>
          <svg width="25" height="25" viewBox="0 0 25 25">
            <polygon
              points="12.5,3 20,7 20,14 12.5,18 5,14 5,7"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="0.8"
              opacity="0.2"
              strokeDasharray="2 1"
            />
          </svg>
        </div>
      </div>

      {/* Main Hero Content - Takes up 100vh */}
      <div className={styles.content}>
        {/* Clean Logo */}
        <div className={styles.logo}>
          <div className={styles.logoContainer}>
            <Image
              alt="logo"
              src="/img/goodhive-logo.png"
              fill={true}
              className="object-contain"
            />
          </div>
        </div>

        {/* Typography-First Title */}
        <div className={styles.typography}>
          <div className={styles.badge}>
            <span className={styles.icon}>✦</span>
            Buzzing with Innovation
          </div>
          <h1 className={styles.title}>
            <span className={styles.textGray}>The Collaborative</span>
            <br />
            <span className={styles.textGradient}>Recruitment Hive</span>
            <br />
            <span className={styles.textGray}>for Web3 Devs</span>
          </h1>
          <p className={styles.subtitle}>
            More collaborative, more transparent and fairer than ever.
            <br />
            <span className={styles.highlight}>
              Join the recruitment revolution where value returns to the people
              who create it.
            </span>
          </p>
        </div>

        {/* Simplified Action Buttons */}
        <div className={styles.actionButtons}>
          <button onClick={onFindJobBtnClick} className={styles.primaryButton}>
            Find Web3 Jobs
          </button>

          <button
            onClick={onFindTalentBtnClick}
            className={styles.secondaryButton}
          >
            Hire Top Talent
          </button>
        </div>
      </div>

      {/* Rewards Section - Appears after 100vh */}
      <div className={styles.rewardsSection}>
        <div className={styles.rewardsCard}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <span>🏆</span>
            </div>
            <h3 className={styles.title}>Exclusive Hive Rewards</h3>
          </div>
          <p className={styles.description}>
            Unlock exclusive referral rewards and gain governance power. Enjoy
            privileged access to
            <span className={styles.highlight}> Airdrops and Whitelists</span>,
            and become an esteemed holder of our{" "}
            <span className={styles.highlight}>Scout and Pioneer NFTs</span>.
          </p>
          <button
            onClick={onJoinQuestsClickHandler}
            className={styles.questButton}
          >
            Join the Hive Quest
          </button>
        </div>
      </div>
    </section>
  );
};
