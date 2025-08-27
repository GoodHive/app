"use client";

import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { SimpleConnectButton } from "@/app/components/ThirdwebConnect/SimpleConnectButton";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styles from "./login.module.scss";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const loggedInUserId = Cookies.get("user_id");
    if (loggedInUserId) {
      // User is already logged in, redirect to their profile
      router.push("/talents/my-profile");
      return;
    }
    
    // Clear localStorage if not logged in
    localStorage.clear();
  }, [router]);

  // Onboarding video
  const onboardingVideoUrl =
    "https://www.youtube-nocookie.com/embed/soSiYLg6KnA?rel=0&modestbranding=1";

  // Handle successful wallet connection
  const handleWalletConnect = (accountData: any) => {
    console.log('🐝 User connected successfully:', accountData);
    
    if (accountData.isMigration) {
      toast.success(`Welcome back! Your ${accountData.migrationType || 'wallet'} has been migrated to Thirdweb.`);
    } else if (accountData.isNewUser) {
      toast.success('🐝 Welcome to GoodHive! Your account has been created.');
    } else {
      toast.success('🐝 Welcome back to GoodHive!');
    }
    
    // Redirect handled by HoneyBeeConnectButton
  };

  // Handle wallet connection errors
  const handleWalletError = () => {
    toast.error('Failed to connect wallet. Please try again.');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HoneybeeSpinner />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Video Background */}
      <div className={styles.videocontainer}>
        <iframe
          src={onboardingVideoUrl}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="GoodHive Onboarding"
          className={styles.video}
        />
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.loginContainer}>
          <div className={styles.logo}>
            <Image
              src="/img/goodhive_light_logo.png"
              alt="GoodHive Logo"
              width={200}
              height={50}
              priority
            />
          </div>

          <div className={styles.title}>
            <h1>🐝 Welcome to GoodHive</h1>
            <p>Connect your wallet to join the professional hive</p>
          </div>

          {/* Thirdweb Connect Button - Simplified */}
          <div className={styles.walletSection}>
            <SimpleConnectButton
              label="🐝 Connect to the Hive"
              onSuccess={() => {
                toast.success('🐝 Welcome to GoodHive!');
                router.push('/talents/my-profile');
              }}
            />
          </div>

          {/* Features */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>🔒 Secure Authentication</h3>
              <p>Connect with MetaMask, WalletConnect, or create a new wallet with your email</p>
            </div>
            <div className={styles.feature}>
              <h3>⚡ Gasless Transactions</h3>
              <p>Enjoy gasless transactions with our smart account technology</p>
            </div>
            <div className={styles.feature}>
              <h3>🌐 Polygon Network</h3>
              <p>Built on Polygon for fast, affordable Web3 interactions</p>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p>By connecting, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;