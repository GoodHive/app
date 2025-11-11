"use client";

import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useConnectModal, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "@/clients";
import { activeChain } from "@/config/chains";
import { supportedWallets, connectModalOptions } from "@/lib/auth/walletConfig";
import styles from "./CompanyLandingPage.module.scss";
import {
  Briefcase,
  Globe,
  Zap,
  Lock,
  BarChart3,
  Users,
  Link2,
  Rocket,
  Hexagon
} from "lucide-react";

import { Button } from "@/app/components/button";
import ProfileImageUpload from "@/app/components/profile-image-upload";
import { ReferralSection } from "@/app/components/referral/referral-section";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { countryCodes } from "@/app/constants/phoneNumberCountryCode";
import "@/app/styles/rich-text.css";
import { socialLinks } from "@/app/talents/my-profile/constant";
import { SocialLink } from "@/app/talents/my-profile/social-link";
import LabelOption from "@interfaces/label-option";
import { uploadFileToBucket } from "@utils/upload-file-bucket";
import dynamic from "next/dynamic";
import Link from "next/link";
import "react-quill/dist/quill.snow.css";
import { SelectInput } from "../../components/select-input";
import { countries } from "../../constants/countries";
// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Define Quill modules and formats
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function MyProfile() {
  const [userId, setUserId] = useState<string | undefined>(Cookies.get("user_id"));
  const activeAccount = useActiveAccount();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const imageInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    headline: "",
    designation: "",
    address: "",
    country: "",
    city: "",
    phone_country_code: "",
    phone_number: "",
    email: "",
    telegram: "",
    image_url: "",
    linkedin: "",
    github: "",
    twitter: "",
    stackoverflow: "",
    portfolio: "",
    status: "",
    referrer: "",
    approved: false,
    inreview: null,
    wallet_address: "",
  });

  const unapprovedProfile =
    profileData?.approved === false && profileData.inreview === true;

  const savedProfile =
    profileData?.approved === false && profileData.inreview === false;

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);
  const [noProfileFound, setNoProfileFound] = useState<boolean>(false);
  const [isShowReferralSection, setIsShowReferralSection] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<LabelOption | null>(
    null,
  );

  const [selectedPhoneCountryCode, setSelectedPhoneCountryCode] =
    useState<LabelOption | null>(null);

  // Wallet address will be handled by Thirdweb integration later
  // const { address } = useAccount();
  const walletAddress = profileData?.wallet_address || "";

  // Connect Modal hook for authentication
  const { connect, isConnecting } = useConnectModal();

  // Convert countryCodes to LabelOption format for SelectInput
  const phoneCountryCodeOptions: LabelOption[] = useMemo(
    () =>
      countryCodes.map((countryCode) => ({
        label: `${countryCode.name} ${countryCode.dial_code}`,
        value: countryCode.dial_code,
      })),
    [],
  );

  const handleImageClick = () => {
    setProfileData({ ...profileData, image_url: "" });
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    const profileResponse = await fetch(
      `/api/companies/my-profile?userId=${userId}`,
    );

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();

      setProfileData(profileData);

      if (profileData.country) {
        const countryOption = countries.find(
          (country) => country.value === profileData.country,
        );
        setSelectedCountry(countryOption || null);
      }

      if (profileData.phone_country_code) {
        const phoneCountryCodeOption = phoneCountryCodeOptions.find(
          (option) => option.value === profileData.phone_country_code,
        );
        setSelectedPhoneCountryCode(phoneCountryCodeOption || null);
      }

      setIsShowReferralSection(true);
    } else {
      console.log("No profile found or error:", profileResponse.status);
      setNoProfileFound(true);
    }
    setIsLoading(false);
  }, [userId]);

  // Monitor for wallet connection changes and update userId
  useEffect(() => {
    const checkUserIdFromCookies = () => {
      const currentUserId = Cookies.get("user_id");
      if (currentUserId && currentUserId !== userId) {
        setUserId(currentUserId);
      }
    };

    // Check immediately
    checkUserIdFromCookies();

    // Set up an interval to periodically check for userId changes
    const interval = setInterval(checkUserIdFromCookies, 1000);

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    setNoProfileFound(false);

    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  const scrollToFirstError = (errors: { [key: string]: string }) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Define the order of fields as they appear on the page
    const fieldOrder = [
      'image_url',
      'designation', 
      'headline',
      'email',
      'address',
      'city', 
      'country',
      'phone_country_code',
      'phone_number',
      'telegram',
      'linkedin',
      'github',
      'twitter',
      'stackoverflow',
      'portfolio'
    ];

    // Find the first error field based on page order
    const firstErrorField = fieldOrder.find(field => errorKeys.includes(field)) || errorKeys[0];
    
    // Find the element and scroll to it
    const element = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}, [data-field="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the element if it's an input
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        setTimeout(() => element.focus(), 500);
      }
    }
  };

  const handleFormSubmit = async (data: any, validate: boolean) => {
    setIsSaving(true);

    const isNewUser = !profileData.designation;
    const referralCode = Cookies.get("referralCode");
    const imageUrl = profileImage
      ? await uploadFileToBucket(profileImage)
      : profileData.image_url;

    const isAlreadyReferred = profileData.referrer ? true : false;

    const requiredFields = {
      headline: "Company description",
      designation: "Company name", 
      address: "Address",
      email: "Email",
      country: "Country",
      city: "City",
      phone_country_code: "Phone country code",
      phone_number: "Phone number",
      telegram: "Telegram",
    };

    if (validate) {
      const newErrors: { [key: string]: string } = {};

      // Check for picture first
      if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
        newErrors['image_url'] = 'Profile picture is required';
        toast.error("🐝 Please upload a company profile picture!");
      }

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key]) {
          newErrors[key] = `${label} is required`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        scrollToFirstError(newErrors);
        if (!newErrors['image_url']) {
          toast.error("Please fill in all required fields");
        }
        setIsSaving(false);
        return;
      }
    }

    setErrors({}); // Clear errors if validation passes

    const dataForm = {
      headline: data.headline,
      user_id: userId,
      designation: data.designation,
      address: data.address,
      country: selectedCountry?.value,
      city: data.city,
      phone_country_code: selectedPhoneCountryCode?.value,
      phone_number: data["phone_number"],
      email: data.email,
      telegram: data.telegram,
      image_url: imageUrl,
      wallet_address: walletAddress,
      linkedin: data.linkedin,
      github: data.github,
      stackoverflow: data.stackoverflow,
      twitter: data.twitter,
      portfolio: data.portfolio,
      status: profileData.status || "pending",
      referrer: isAlreadyReferred ? null : referralCode,
      inreview: validate,
    };

    const filteredData = Object.fromEntries(
      Object.entries(dataForm).filter(
        ([, value]) => value != null && value !== "",
      ),
    );

    const profileResponse = await fetch("/api/companies/my-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredData),
    });

    setIsSaving(false);

    if (!profileResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      if (validate) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: dataForm.email,
            type: "new-company",
            subject: `Welcome to GoodHive, ${dataForm.designation}! 🌟 Let's Connect You with Top IT Talent`,
          }),
        });

        toast.success("Profile sent to review by the core team!");
      } else {
        toast.success("Profile Saved!");
        window.location.reload();
      }
    }
  };

  const handleFormSaving = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, false);
  };

  const handleFormReview = (e: any) => {
    e.preventDefault();
    handleFormSubmit(profileData, true);
  };

  const handleConnectWallet = async () => {
    try {
      await connect({
        client: thirdwebClient,
        wallets: supportedWallets,
        chain: activeChain,
        ...connectModalOptions,
      });
    } catch (error) {
      console.debug("Connect modal dismissed", error);
    }
  };

  if (!userId) {
    return (
      <main className={styles.container}>
        {/* Decorative Background Elements */}
        <div className={styles.backgroundDecorations}>
          {/* Honeycomb Pattern */}
          <div className={styles.honeycombPattern}>
            <div className={styles.honeycombGrid}>
              {Array.from({ length: 144 }, (_, i) => (
                <div key={i} className={styles.honeycombCell}></div>
              ))}
            </div>
          </div>

          {/* Floating Bees */}
          <div className={styles.floatingBee1}>
            <div className={`${styles.beeAnimation} ${styles.beeAnimation1}`}>
              <span className={styles.bee}>🐝</span>
            </div>
          </div>

          <div className={styles.floatingBee2}>
            <div className={`${styles.beeAnimation} ${styles.beeAnimation2}`}>
              <span className={styles.bee2}>🐝</span>
            </div>
          </div>

          <div className={styles.floatingBee3}>
            <div className={`${styles.beeAnimation} ${styles.beeAnimation3}`}>
              <span className={styles.bee3}>🐝</span>
            </div>
          </div>

          {/* Hexagon Clusters */}
          <div className={styles.topLeftHexCluster}>
            <svg className="w-[400px] h-[400px]" viewBox="0 0 400 400">
              <defs>
                <linearGradient id="hexGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="hexGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points="180,60 250,95 250,165 180,200 110,165 110,95"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                opacity="0.3"
                strokeDasharray="5 3"
              />

              <polygon
                points="140,130 200,160 200,220 140,250 80,220 80,160"
                fill="url(#hexGradient1)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.25"
              />

              <polygon
                points="260,40 300,62 300,106 260,128 220,106 220,62"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.35"
              />

              <polygon
                points="300,160 340,182 340,226 300,248 260,226 260,182"
                fill="url(#hexGradient2)"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.2"
              />

              <polygon
                points="80,80 105,93 105,119 80,132 55,119 55,93"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.4"
                strokeDasharray="3 2"
              />

              <polygon
                points="220,260 245,273 245,299 220,312 195,299 195,273"
                fill="#fbbf24"
                fillOpacity="0.1"
                stroke="#d97706"
                strokeWidth="1.2"
                opacity="0.3"
              />
            </svg>
          </div>

          <div className={styles.topRightHexCluster}>
            <svg className="w-[350px] h-[350px]" viewBox="0 0 350 350">
              <defs>
                <linearGradient id="hexGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points="220,50 280,80 280,140 220,170 160,140 160,80"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                opacity="0.25"
                strokeDasharray="5 3"
              />

              <polygon
                points="170,110 230,140 230,200 170,230 110,200 110,140"
                fill="url(#hexGradient3)"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.2"
              />

              <polygon
                points="260,180 300,200 300,240 260,260 220,240 220,200"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.3"
              />

              <polygon
                points="120,220 160,240 160,280 120,300 80,280 80,240"
                fill="#f59e0b"
                fillOpacity="0.08"
                stroke="#fbbf24"
                strokeWidth="1.5"
                opacity="0.18"
              />
            </svg>
          </div>

          <div className={styles.bottomLeftHexCluster}>
            <svg className="w-[300px] h-[300px]" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="hexGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              <polygon
                points="150,200 210,230 210,290 150,320 90,290 90,230"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.2"
                opacity="0.22"
                strokeDasharray="4 3"
              />

              <polygon
                points="120,150 180,180 180,240 120,270 60,240 60,180"
                fill="url(#hexGradient4)"
                stroke="#f59e0b"
                strokeWidth="1.6"
                opacity="0.18"
              />

              <polygon
                points="200,120 240,140 240,180 200,200 160,180 160,140"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.8"
                opacity="0.28"
              />
            </svg>
          </div>

          <div className={styles.bottomRightHexCluster}>
            <svg className="w-[450px] h-[450px]" viewBox="0 0 450 450">
              <defs>
                <linearGradient id="hexGradient5" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="hexGradient6" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              <polygon
                points="260,220 330,265 330,355 260,400 190,355 190,265"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                opacity="0.3"
                strokeDasharray="6 4"
              />

              <polygon
                points="310,150 370,185 370,255 310,290 250,255 250,185"
                fill="url(#hexGradient5)"
                stroke="#d97706"
                strokeWidth="1.8"
                opacity="0.22"
              />

              <polygon
                points="180,360 220,382 220,426 180,448 140,426 140,382"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.35"
              />

              <polygon
                points="140,230 180,252 180,296 140,318 100,296 100,252"
                fill="url(#hexGradient6)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.25"
              />

              <polygon
                points="360,330 385,343 385,369 360,382 335,369 335,343"
                fill="none"
                stroke="#d97706"
                strokeWidth="1.5"
                opacity="0.4"
                strokeDasharray="3 2"
              />
            </svg>
          </div>

          {/* Scattered Small Hexagons */}
          <div className={styles.scatteredHexagons}>
            <div className={styles.topCenterHex}>
              <svg width="50" height="50" viewBox="0 0 50 50">
                <polygon
                  points="25,7 40,15 40,31 25,39 10,31 10,15"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.2"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>

            <div className={styles.midLeftHex}>
              <svg width="35" height="35" viewBox="0 0 35 35">
                <polygon
                  points="17.5,5 27.5,10 27.5,20 17.5,25 7.5,20 7.5,10"
                  fill="#fbbf24"
                  fillOpacity="0.08"
                  stroke="#d97706"
                  strokeWidth="1.2"
                  opacity="0.25"
                />
              </svg>
            </div>

            <div className={styles.midRightHex}>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <polygon
                  points="20,6 32,12 32,24 20,30 8,24 8,12"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="1.8"
                  opacity="0.18"
                  strokeDasharray="3 2"
                />
              </svg>
            </div>

            <div className={styles.bottomCenterHex}>
              <svg width="45" height="45" viewBox="0 0 45 45">
                <polygon
                  points="22.5,6 36,13 36,27 22.5,34 9,27 9,13"
                  fill="#f59e0b"
                  fillOpacity="0.06"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            {/* Floating elements */}
            <div className={styles.floatingElement1}></div>
            <div className={styles.floatingElement2}></div>

            <div className={styles.heroContent}>
              <div className={styles.badge}>
                <Hexagon className={styles.badgeIcon} />
                <span className={styles.badgeText}>GoodHive for Companies</span>
              </div>

              <h1 className={styles.heroTitle}>
                Join the Premier
                <span className={styles.heroTitleGradient}>
                  Web3 Talent Marketplace
                </span>
              </h1>

              <p className={styles.heroDescription}>
                Connect with top-tier Web3 developers, designers, and blockchain experts.
                Build your dream team and scale your projects with the best talent in the industry.
              </p>

              {/* Connect Wallet Button */}
              <div className={styles.connectSection}>
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={styles.connectButton}
                >
                  <div className={styles.connectButtonOverlay}></div>
                  <div className={styles.connectButtonContent}>
                    {isConnecting ? (
                      <>
                        <div className={styles.spinner}></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className={styles.connectButtonIcon} />
                        Connect Wallet to Get Started
                      </>
                    )}
                  </div>
                  <div className={styles.connectButtonShine}></div>
                </button>

                <p className={styles.connectDescription}>
                  Connect with MetaMask, WalletConnect, or create an account with your email
                </p>
              </div>

              {/* Decorative line */}
              <div className={styles.decorativeLine}>
                <div className={styles.lineSegment1}></div>
                <div className={styles.lineDot1}></div>
                <div className={styles.lineSegment2}></div>
                <div className={styles.lineDot2}></div>
                <div className={styles.lineSegment3}></div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className={styles.featuresGrid}>
            {/* Feature 1 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration1}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon1}`}>
                  <Briefcase />
                </div>
                <h3 className={styles.featureTitle}>Post Unlimited Jobs</h3>
                <p className={styles.featureDescription}>
                  Create and manage job postings for your Web3 projects. Reach thousands of qualified candidates instantly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration2}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon2}`}>
                  <Globe />
                </div>
                <h3 className={styles.featureTitle}>Global Talent Pool</h3>
                <p className={styles.featureDescription}>
                  Access top Web3 developers, designers, and blockchain experts from around the world.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration3}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon3}`}>
                  <Zap />
                </div>
                <h3 className={styles.featureTitle}>Fast Hiring</h3>
                <p className={styles.featureDescription}>
                  Streamlined application process and direct communication tools to hire the best talent quickly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration4}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon4}`}>
                  <Lock />
                </div>
                <h3 className={styles.featureTitle}>Secure & Verified</h3>
                <p className={styles.featureDescription}>
                  All talent profiles are verified and vetted. Secure Web3-native hiring with smart contracts.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration5}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon5}`}>
                  <BarChart3 />
                </div>
                <h3 className={styles.featureTitle}>Analytics & Insights</h3>
                <p className={styles.featureDescription}>
                  Track application metrics, hiring performance, and team growth with detailed analytics.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureCardDecoration} ${styles.featureCardDecoration6}`}></div>
              <div className={styles.featureContent}>
                <div className={`${styles.featureIcon} ${styles.featureIcon6}`}>
                  <Users />
                </div>
                <h3 className={styles.featureTitle}>Community Driven</h3>
                <p className={styles.featureDescription}>
                  Join a thriving community of Web3 companies and talent building the future together.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaCard}>
              <div className={styles.ctaCardDecoration1}></div>
              <div className={styles.ctaCardDecoration2}></div>

              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>
                  Ready to Build Your
                  <span className={styles.ctaTitleGradient}>
                    Dream Team?
                  </span>
                </h2>
                <p className={styles.ctaDescription}>
                  Join hundreds of Web3 companies already using GoodHive to find and hire exceptional talent.
                </p>

                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={styles.ctaButton}
                >
                  <div className={styles.ctaButtonOverlay}></div>
                  <div className={styles.ctaButtonContent}>
                    {isConnecting ? (
                      <>
                        <div className={styles.ctaSpinner}></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Rocket className={styles.ctaButtonIcon} />
                        Get Started Now
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile, Please Wait"} />;
  }
  if (isSaving) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  return (
    <>
      <style jsx global>{`
        .quill-editor-custom .ql-toolbar {
          border: 1px solid #f59e0b !important;
          border-bottom: 1px solid #f59e0b !important;
          background: #fef3c7 !important;
          border-radius: 12px 12px 0 0 !important;
        }
        
        .quill-editor-custom .ql-container {
          border: 1px solid #f59e0b !important;
          border-top: none !important;
          font-size: 16px !important;
          min-height: 350px !important;
          border-radius: 0 0 12px 12px !important;
        }
        
        .quill-editor-custom .ql-editor {
          padding: 20px !important;
          min-height: 350px !important;
        }
        
        .quill-editor-custom .ql-editor::before {
          font-style: italic !important;
          color: #92400e !important;
        }
      `}</style>
      
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          {/* Honeycomb Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
              {Array.from({ length: 144 }, (_, i) => (
                <div key={i} className="w-8 h-8 border-2 border-amber-300 transform rotate-45"></div>
              ))}
            </div>
          </div>
          
          {/* Floating Bees */}
          <div className="absolute top-20 right-20 w-8 h-8 opacity-60">
            <div className="relative animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }}>
              <span className="text-2xl">🐝</span>
            </div>
          </div>
          
          <div className="absolute bottom-32 left-16 w-6 h-6 opacity-40">
            <div className="relative animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}>
              <span className="text-xl">🐝</span>
            </div>
          </div>
        </div>

        <div className="relative container mx-auto px-6 py-8">
          {/* Status Banners */}
          {noProfileFound && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl p-6 shadow-lg border-2 border-amber-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Getting Started</h3>
                    <p className="text-amber-100">Please create a profile to continue your hive journey!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {unapprovedProfile && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Under Review</h3>
                    <p className="text-blue-100">Your profile is pending approval. It will be live soon after review.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {savedProfile && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 shadow-lg border-2 border-amber-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div>
                <div className="relative flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-4 animate-pulse">
                    <span className="text-2xl">🐝</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">Almost Ready!</h3>
                    <p className="text-amber-100">Your profile is saved. Complete the mandatory fields and submit for review when ready.</p>
                  </div>
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Header */}
          <div className="relative text-center mb-16 py-12">
            {/* Floating elements */}
            <div className="absolute top-4 left-1/4 w-16 h-16 bg-amber-400 bg-opacity-20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-4 right-1/4 w-20 h-20 bg-yellow-400 bg-opacity-15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center bg-white bg-opacity-60 backdrop-blur-sm text-amber-800 px-6 py-3 rounded-2xl text-sm font-semibold mb-6 shadow-lg border-2 border-amber-200 transform hover:-translate-y-1 transition-all duration-300">
                <span className="text-xl mr-3">🍯</span>
                <span className="text-lg">Company Hive Profile</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Build Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 mt-2">
                  Dream Company Profile
                </span>
              </h1>
              
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
                Showcase your company's vision, culture, and opportunities to attract the finest Web3 talent from around the world
              </p>
              
              {/* Decorative line */}
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-400"></div>
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <div className="w-24 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-400"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-yellow-400 to-transparent"></div>
              </div>
            </div>
          </div>
          
          {/* Main Form Card */}
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-amber-200 p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400 bg-opacity-20 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-yellow-400 bg-opacity-15 rounded-full"></div>

            <form className="relative">
              <div className="flex flex-col items-center justify-center w-full mb-12">
              <div className="flex justify-center mb-4" data-field="image_url">
                <div className="relative">
                  <ProfileImageUpload
                    currentImage={profileData.image_url}
                    displayName={profileData.designation || ""}
                    onImageUpdate={(imageUrl) => {
                      setProfileData({
                        ...profileData,
                        image_url: imageUrl,
                      });
                      // Clear image error when image is uploaded
                      if (errors.image_url && imageUrl) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.image_url;
                          return newErrors;
                        });
                      }
                    }}
                    size={180}
                  />
                  {errors.image_url && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <p className="text-red-500 text-sm bg-white px-3 py-1 rounded-full shadow-md border border-red-200">
                        {errors.image_url}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full flex justify-center gap-4 mb-8">
              <Link
                href={`/companies/${userId}`}
                className="inline-flex items-center px-6 py-3 bg-white bg-opacity-80 text-amber-700 font-semibold rounded-xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                👁️ Public View
              </Link>

              {!noProfileFound && !unapprovedProfile && (
                <Link
                  href="/companies/create-job"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  💼 Create Job
                </Link>
              )}
            </div>
            
            {noProfileFound && (
              <div className="text-center mb-8">
                <p className="text-amber-700 bg-amber-100 px-4 py-2 rounded-full inline-block">
                  🐝 Please create a profile before posting jobs!
                </p>
              </div>
            )}
            
            {unapprovedProfile && (
              <div className="text-center mb-8">
                <p className="text-blue-700 bg-blue-100 px-4 py-2 rounded-full inline-block">
                  ⏳ Profile approval required before creating jobs
                </p>
              </div>
            )}
            {/* Clean Form Fields */}
            <div className="space-y-8">
              {/* Company Name */}
              <div className="flex-1">
                <label
                  htmlFor="designation"
                  className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                >
                  Company Name*
                </label>
                <input
                  name="designation"
                  className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="Enter your company name"
                  type="text"
                  maxLength={100}
                  defaultValue={profileData.designation}
                  onChange={(e) => {
                    setProfileData({
                      ...profileData,
                      designation: e.target.value,
                    });
                    // Clear error when user starts typing
                    if (errors.designation) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.designation;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.designation && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.designation as string}
                  </p>
                )}
              </div>

              {/* Company Description - Increased Height */}
              <div className="mt-5">
                <label
                  htmlFor="headline"
                  className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                >
                  Company Description*
                </label>
                <div style={{ borderRadius: "12px" }}>
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    className="quill-editor-custom"
                    value={profileData.headline || ""}
                    onChange={(content) => {
                      setProfileData({ ...profileData, headline: content });
                      // Clear error when user starts typing
                      if (errors.headline) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.headline;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Describe your company, mission, values, and what makes you unique..."
                    style={{
                      fontSize: "1rem",
                      height: "400px", // Much taller like talent profile
                      marginBottom: "50px",
                    }}
                  />
                </div>
                {errors.headline && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.headline as string}
                  </p>
                )}
                <p className="text-amber-600 text-sm text-right w-full mt-12 font-medium">
                  {profileData.headline?.replace(/<[^>]*>/g, "")?.length || 0} / 10,000
                </p>
              </div>

              {/* Email */}
              <div className="flex-1">
                <label
                  htmlFor="email"
                  className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                >
                  Email Address*
                </label>
                <input
                  name="email"
                  className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="company@example.com"
                  type="email"
                  maxLength={255}
                  defaultValue={profileData.email}
                  onChange={(e) => {
                    setProfileData({ ...profileData, email: e.target.value });
                    // Clear error when user starts typing
                    if (errors.email) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email as string}
                  </p>
                )}
              </div>

              {/* Address, City & Country Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="address"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    Address*
                  </label>
                  <input
                    name="address"
                    className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="Company address"
                    type="text"
                    maxLength={100}
                    defaultValue={profileData.address}
                    onChange={(e) => {
                      setProfileData({ ...profileData, address: e.target.value });
                      // Clear error when user starts typing
                      if (errors.address) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.address;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.address as string}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="city"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    City*
                  </label>
                  <input
                    name="city"
                    className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="City name"
                    type="text"
                    pattern="[a-zA-Z \-]+"
                    maxLength={100}
                    defaultValue={profileData.city}
                    onChange={(e) => {
                      setProfileData({ ...profileData, city: e.target.value });
                      // Clear error when user starts typing
                      if (errors.city) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.city;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.city as string}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <SelectInput
                    required={false}
                    labelText="Country"
                    name="country"
                    inputValue={selectedCountry}
                    setInputValue={(country: any) => {
                      setSelectedCountry(country);
                    setProfileData({
                      ...profileData,
                      country: country?.value || "",
                    });
                      // Clear error when country is selected
                      if (errors.country) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.country;
                          return newErrors;
                        });
                      }
                    }}
                    options={countries}
                    defaultValue={
                      countries[
                        countries.findIndex(
                          (country) => country.value === profileData?.country,
                        )
                      ]
                    }
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.country as string}
                    </p>
                  )}
                </div>
              </div>
              {/* Phone Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex-1">
                  <SelectInput
                    required={false}
                    labelText="Phone Country Code"
                    name="phone_country_code"
                    inputValue={selectedPhoneCountryCode}
                    setInputValue={(phoneCountryCode: any) => {
                      setSelectedPhoneCountryCode(phoneCountryCode);
                      setProfileData({ 
                        ...profileData, 
                        phone_country_code: phoneCountryCode?.value || '' 
                      });
                      // Clear error when user selects
                      if (errors.phone_country_code) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone_country_code;
                          return newErrors;
                        });
                      }
                    }}
                    options={phoneCountryCodeOptions}
                    defaultValue={
                      phoneCountryCodeOptions.find(
                        (option) => option.value === profileData?.phone_country_code,
                      )
                    }
                  />
                  {errors.phone_country_code && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone_country_code as string}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="phone_number"
                    className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                  >
                    Phone Number*
                  </label>
                  <input
                    name="phone_number"
                    className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="Phone Number"
                    type="text"
                    pattern="[0-9]+"
                    maxLength={20}
                    defaultValue={profileData.phone_number}
                    onChange={(e) => {
                      setProfileData({
                        ...profileData,
                        phone_number: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (errors.phone_number) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.phone_number;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.phone_number && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone_number as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Telegram */}
              <div className="flex-1">
                <label
                  htmlFor="telegram"
                  className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
                >
                  Telegram*
                </label>
                <input
                  name="telegram"
                  className="form-control block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="@your_telegram_handle"
                  type="text"
                  maxLength={100}
                  defaultValue={profileData.telegram}
                  onChange={(e) => {
                    setProfileData({ ...profileData, telegram: e.target.value });
                    // Clear error when user starts typing
                    if (errors.telegram) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.telegram;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.telegram && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.telegram as string}
                  </p>
                )}
              </div>

              {/* Social Media Links */}
              <div className="flex w-full flex-col mt-8">
                <h3 className="inline-block ml-3 text-base font-medium text-gray-800 form-label mb-4">
                  Social Media Links (Optional):
                </h3>
                <div className="space-y-4">
                  {socialLinks.map((socialLink) => (
                    <SocialLink
                      key={socialLink.name}
                      name={socialLink.name}
                      icon={socialLink.icon}
                      placeholder={socialLink.placeholder}
                      defaultValue={
                        profileData[
                          socialLink.name as keyof typeof profileData
                        ]?.toString() || ""
                      }
                      setValue={(name, value) => {
                        setProfileData((prev) => ({
                          ...prev,
                          [name]: value,
                        }));
                      }}
                      errorMessage={errors[socialLink.name as keyof typeof errors]}
                    />
                  ))}
                </div>
              </div>

              {isShowReferralSection && <ReferralSection />}
            </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-6 pt-8 mt-8 border-t-2 border-amber-200">
                {isLoading ? (
                  <div className="flex gap-4">
                    <button
                      className="px-8 py-4 bg-amber-300 text-amber-600 font-semibold rounded-2xl opacity-50 cursor-not-allowed transition duration-150 ease-in-out flex items-center"
                      disabled
                    >
                      <div className="w-5 h-5 mr-2 animate-spin border-2 border-amber-600 border-t-transparent rounded-full"></div>
                      Saving...
                    </button>
                    {!profileData.approved && (
                      <button
                        className="px-8 py-4 bg-amber-300 text-amber-600 font-semibold rounded-2xl opacity-50 cursor-not-allowed transition duration-150 ease-in-out flex items-center"
                        disabled
                      >
                        <div className="w-5 h-5 mr-2 animate-spin border-2 border-amber-600 border-t-transparent rounded-full"></div>
                        Processing...
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4 flex-wrap justify-center">
                    <button
                      className="group px-8 py-4 bg-white bg-opacity-80 text-amber-700 font-semibold rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl flex items-center"
                      onClick={handleFormSaving}
                    >
                      <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">💾</span>
                      Save Draft
                    </button>
                    
                    {/* Only show Submit for Review if not approved */}
                    {!profileData.approved && (
                      <button
                        className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg flex items-center relative overflow-hidden"
                        type="submit"
                        onClick={handleFormReview}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center">
                          <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">🚀</span>
                          Submit for Review
                        </span>
                      </button>
                    )}
                    
                    {/* Show approved status if profile is approved */}
                    {profileData.approved && (
                      <div className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg flex items-center">
                        <span className="mr-2">✅</span>
                        Profile Approved
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
