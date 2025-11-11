"use client";

import Cookies from "js-cookie";
import {
  Briefcase,
  CheckCircle,
  CircleUserRound,
  Clock,
  Copy,
  GraduationCap,
  Mail,
  Shield,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BeeHiveSpinner from "../components/spinners/bee-hive-spinner";
import styles from "./user-profile.module.scss";

export interface UserProfile {
  id: number;
  userid: string;
  email: string | null;
  talent_status: "pending" | "approved";
  mentor_status: "pending" | "approved";
  recruiter_status: "pending" | "approved";
  wallet_address?: string;
  thirdweb_wallet_address?: string;
}

export default function UserProfilePage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Add custom animations
  const animationStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(5deg); }
    }
    @keyframes floatReverse {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(10px) rotate(-5deg); }
    }
    @keyframes honeycombShift {
      0% { background-position: 0 0; }
      100% { background-position: 60px 60px; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-reverse { animation: floatReverse 8s ease-in-out infinite; }
    .animate-honeycomb { animation: honeycombShift 20s linear infinite; }
    .animate-pulse-custom { animation: pulse 4s ease-in-out infinite; }
    .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s ease-in-out infinite;
    }
  `;

  const user_id = Cookies.get("user_id");

  const fetchUserProfile = useCallback(async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/profile?user_id=${user_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to connect");
      }

      const data = await response.json();
      console.log(data, "User Data...");
      setUserProfile(data.user);
      setIsConnecting(false);
    } catch (error) {
      setIsConnecting(false);
      alert("Connection failed. Please try again.");
      console.error("Error:", error);
    }
  }, [user_id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (!userProfile) {
    return (
      <div className={styles.loadingContainer}>
        <BeeHiveSpinner size="large" loadingText="Loading User Profile..." />
      </div>
    );
  }

  return (
    <div className={styles.userProfile}>
      {/* Animated Honeycomb Background Pattern */}
      <div className={styles.honeycombBackground}>
        <div className={styles.honeycombPattern}></div>
      </div>

      {/* Floating Hexagon Decorations with Animation */}
      <div className={styles.floatingHexagons}>
        <div className={`${styles.hexagon} ${styles.hex1}`}></div>
        <div className={`${styles.hexagon} ${styles.hex2}`}></div>
        <div className={`${styles.hexagon} ${styles.hex3}`}></div>
        <div className={`${styles.hexagon} ${styles.hex4}`}></div>
        <div className={`${styles.hexagon} ${styles.hex5}`}></div>
        <div className={`${styles.hexagon} ${styles.hex6}`}></div>
      </div>

      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          {/* Decorative honeycomb elements around header with pulsing animation */}
          <div className={styles.decorativeTop}>
            <div className={styles.hexGroup}>
              <div className={`${styles.hex} ${styles.hex1}`}></div>
              <div className={`${styles.hex} ${styles.hex2}`}></div>
              <div className={`${styles.hex} ${styles.hex3}`}></div>
            </div>
          </div>

          <div className={styles.avatar}>
            <CircleUserRound className={styles.avatarIcon} />
            {/* Subtle hexagon pattern on avatar with shimmer effect */}
            <div className={styles.shimmer}></div>
          </div>

          <h1 className={styles.title}>User Profile</h1>
          <p className={styles.subtitle}>
            Manage your 🐝{" "}
            <span className="font-semibold text-amber-700">GoodHive</span>{" "}
            account and track your status across all roles
          </p>

          {/* Subtle decorative elements with staggered pulse */}
          <div className={styles.decorativeBottom}>
            <div className={styles.dotGroup}>
              <div className={`${styles.dot} ${styles.dot1}`}></div>
              <div className={`${styles.dot} ${styles.dot2}`}></div>
              <div className={`${styles.dot} ${styles.dot3}`}></div>
            </div>
          </div>
        </div>

        {/* Profile Cards Grid - Two Column Layout */}
        <div className={styles.profileGrid}>
          {/* Left Column - Account Information */}
          <div>
            <div
              className={`${styles.card} ${styles.animateFadeInUp} ${styles.delay1}`}
            >
              <div className={styles.cardHeader}>
                <div className={`${styles.icon} ${styles.blue}`}>
                  <User className={styles.iconSvg} />
                </div>
                <h2 className={styles.title}>Account Info</h2>
              </div>

              <div className={styles.spaceY6}>
                <InfoItem
                  icon={Mail}
                  label="Email Address"
                  value={userProfile.email || "No Email Connected"}
                  status={userProfile.email ? "connected" : "disconnected"}
                />
                <InfoItem
                  icon={User}
                  label="User ID"
                  value={userProfile.userid}
                  copyable
                />
              </div>
            </div>
          </div>

          {/* Right Column - Role Status */}
          <div>
            <div
              className={`${styles.card} ${styles.animateFadeInUp} ${styles.delay2}`}
            >
              <div className={styles.cardHeader}>
                <div className={`${styles.icon} ${styles.purple}`}>
                  <Users className={styles.iconSvg} />
                </div>
                <h2 className={styles.title}>Role Status</h2>
              </div>

              <div className={styles.spaceY4}>
                <RoleStatusCard
                  icon={Briefcase}
                  title="Talent"
                  status={userProfile.talent_status}
                  description="Access to job opportunities"
                />
                <RoleStatusCard
                  icon={GraduationCap}
                  title="Mentor"
                  status={userProfile.mentor_status}
                  description="Guide and support others"
                />
                <RoleStatusCard
                  icon={Users}
                  title="Recruiter"
                  status={userProfile.recruiter_status}
                  description="Post jobs and find talent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connections - Full Width */}
        <div className={styles.walletSection}>
          <div className={`${styles.card} ${styles.animateFadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.icon} ${styles.green}`}>
                <Wallet className={styles.iconSvg} />
              </div>
              <h2 className={styles.title}>Wallets</h2>
            </div>

            <div className={styles.walletGrid}>
              <WalletItem
                icon={Wallet}
                label="External Wallet"
                address={userProfile.wallet_address}
                description="Your connected external wallet"
              />
              <WalletItem
                icon={Shield}
                label="Thirdweb Wallet"
                address={userProfile.thirdweb_wallet_address}
                description="Your secure Thirdweb wallet"
              />
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className={styles.statisticsOverview}>
          <h2 className={styles.title}>Account Overview</h2>
          <div className={styles.statsGrid}>
            <StatCard
              value={userProfile.email ? "1" : "0"}
              label="Connected Accounts"
              color="blue"
            />
            <StatCard
              value={[
                userProfile.talent_status,
                userProfile.mentor_status,
                userProfile.recruiter_status,
              ]
                .filter((s) => s === "approved")
                .length.toString()}
              label="Approved Roles"
              color="green"
            />
            <StatCard
              value={[
                userProfile.talent_status,
                userProfile.mentor_status,
                userProfile.recruiter_status,
              ]
                .filter((s) => s === "pending")
                .length.toString()}
              label="Pending Approvals"
              color="yellow"
            />
            <StatCard
              value={[
                userProfile.wallet_address,
                userProfile.thirdweb_wallet_address,
              ]
                .filter(Boolean)
                .length.toString()}
              label="Connected Wallets"
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component Interfaces
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status?: "connected" | "disconnected";
  copyable?: boolean;
}

interface RoleStatusCardProps {
  icon: React.ElementType;
  title: string;
  status: "pending" | "approved";
  description: string;
}

interface WalletItemProps {
  icon: React.ElementType;
  label: string;
  address?: string;
  description: string;
}

interface StatCardProps {
  value: string;
  label: string;
  color: "blue" | "green" | "yellow" | "purple";
}

// InfoItem Component
function InfoItem({
  icon: Icon,
  label,
  value,
  status,
  copyable,
}: InfoItemProps) {
  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() =>
        toast.success("Copied to clipboard!", {
          icon: "📋",
        }),
      )
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <div className={styles.infoItem}>
      <div className={styles.left}>
        <div className={styles.icon}>
          <Icon className={styles.iconSvg} />
        </div>
        <div className={styles.content}>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
        </div>
      </div>
      <div className={styles.right}>
        {status && (
          <div className="flex items-center">
            {status === "connected" ? (
              <CheckCircle
                className={`${styles.statusIcon} ${styles.connected}`}
              />
            ) : (
              <XCircle
                className={`${styles.statusIcon} ${styles.disconnected}`}
              />
            )}
          </div>
        )}
        {copyable && (
          <button
            onClick={handleCopy}
            className={styles.copyButton}
            title="Copy to clipboard"
          >
            <Copy className={styles.copyIcon} />
          </button>
        )}
      </div>
    </div>
  );
}

// RoleStatusCard Component
function RoleStatusCard({
  icon: Icon,
  title,
  status,
  description,
}: RoleStatusCardProps) {
  const getStatusIcon = () => {
    return status === "approved" ? CheckCircle : Clock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={styles.roleStatusCard}>
      <div
        className={`${styles.icon} ${status === "approved" ? styles.approved : styles.pending}`}
      >
        <Icon className={styles.iconSvg} />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.status}>
            <StatusIcon
              className={`${styles.statusIcon} ${status === "approved" ? styles.approved : styles.pending}`}
            />
            <span
              className={`${styles.statusBadge} ${status === "approved" ? styles.approved : styles.pending}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

// WalletItem Component
function WalletItem({
  icon: Icon,
  label,
  address,
  description,
}: WalletItemProps) {
  const handleCopy = () => {
    if (address) {
      navigator.clipboard
        .writeText(address)
        .then(() =>
          toast.success("Address copied to clipboard!", {
            icon: "🔗",
          }),
        )
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  const formatAddress = (addr: string) => {
    // Don't truncate if there's space - let CSS handle overflow if needed
    return addr;
  };

  return (
    <div className={styles.walletItem}>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.icon}>
            <Icon className={styles.iconSvg} />
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>{label}</h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
        {address && (
          <div className={styles.right}>
            <CheckCircle className={styles.statusIcon} />
            <button
              onClick={handleCopy}
              className={styles.copyButton}
              title="Copy address"
            >
              <Copy className={styles.copyIcon} />
            </button>
          </div>
        )}
      </div>
      <div className={styles.address}>
        {address ? (
          <span className={styles.addressText}>{formatAddress(address)}</span>
        ) : (
          <span className={styles.notConnected}>
            <XCircle className={styles.icon} />
            Not Connected
          </span>
        )}
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.icon} ${styles[color]}`}>
        <span className={styles.value}>{value}</span>
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
