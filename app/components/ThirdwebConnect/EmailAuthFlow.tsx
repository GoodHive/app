"use client";

import {
  getThirdwebClient,
  smartAccountConfig,
  trackWalletEvent,
} from "@/lib/thirdweb/config";
import Cookies from "js-cookie";
import React, { useCallback, useState } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

// Icons (you can replace these with actual icon components)
const MailIcon = ({ size = 20, color = "#666666" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ArrowRightIcon = ({ size = 18, color = "#111111" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </svg>
);

const CheckCircleIcon = ({ size = 48, color = "#10b981" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

interface EmailAuthFlowProps {
  onSuccess?: (account: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}

type AuthStep = "email" | "verifying" | "complete" | "error";

export function EmailAuthFlow({
  onSuccess,
  onError,
  redirectTo = "/talents/my-profile",
  className,
}: EmailAuthFlowProps) {
  const { connect, isConnecting } = useConnect();
  const account = useActiveAccount();
  const client = getThirdwebClient();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<AuthStep>("email");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email form submission
  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || !isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      setError(null);
      setStep("verifying");
      setIsProcessing(true);
      const startTime = Date.now();

      try {
        console.log("🐝 Starting email authentication...");

        // Create in-app wallet with email authentication
        const wallet = inAppWallet({
          auth: {
            options: ["email"],
          },
          smartAccount: smartAccountConfig,
        });

        // Connect with email strategy
        await connect(async () => {
          const authResult = await wallet.connect({
            client,
            strategy: "email",
            email,
          });

          console.log("🐝 Email authentication successful:", authResult);
          return wallet;
        });

        // Track successful connection
        const connectionTime = Date.now() - startTime;
        trackWalletEvent("wallet_connected", {
          wallet_type: "in-app",
          connection_time: connectionTime,
          address: "",
          has_smart_account: true,
          auth_provider: "email",
        });

        setStep("complete");

        // Handle successful authentication
        if (account) {
          // Verify with backend
          await handleUserVerification(account, email);
        }
      } catch (error) {
        console.error("🐝 Email authentication failed:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Email authentication failed";

        setError(errorMessage);
        setStep("error");

        // Track error
        trackWalletEvent("wallet_connection_error", {
          wallet_type: "in-app",
          connection_time: Date.now() - startTime,
          address: "",
          has_smart_account: false,
          auth_provider: "email",
          error: errorMessage,
        });

        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [email, connect, client, account, onError, handleUserVerification],
  );

  // Handle user verification with backend
  const handleUserVerification = useCallback(
    async (walletAccount: any, userEmail: string) => {
      try {
        const response = await fetch("/api/auth/thirdweb-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            address: walletAccount.address,
            smartAccount: walletAccount.smartAccount?.address || null,
            walletType: "in-app",
            authMethod: "in-app",
            email: userEmail,
            authProvider: "email",
          }),
        });

        if (!response.ok) {
          throw new Error(`Verification failed (${response.status})`);
        }

        const data = await response.json();
        console.log("🐝 User verification completed:", data);

        // Store session data
        if (data.user?.user_id) {
          Cookies.set("user_id", data.user.user_id, { expires: 7 });
          Cookies.set("user_address", walletAccount.address, { expires: 7 });
        }

        // Call success callback
        if (onSuccess) {
          onSuccess({
            ...walletAccount,
            userData: data.user,
            isNewUser: data.isNewUser,
            isMigration: data.isMigration,
          });
        }

        // Auto-redirect after success
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 2000);
      } catch (error) {
        console.error("🐝 User verification error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Account verification failed";
        setError(errorMessage);
        setStep("error");
      }
    },
    [onSuccess, redirectTo],
  );

  // Reset form
  const resetForm = useCallback(() => {
    setStep("email");
    setError(null);
    setEmail("");
    setIsProcessing(false);
  }, []);

  // Styles
  const containerStyle = {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "24px",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    border: "1px solid #f3f4f6",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    paddingLeft: "48px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "16px",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.2s ease",
    outline: "none",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ffc905 0%, #ffb300 100%)",
    color: "#111111",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    fontFamily: "Inter, sans-serif",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(255, 201, 5, 0.3)",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "#fff3cd",
    border: "2px solid #ffc905",
    boxShadow: "none",
  };

  return (
    <div
      className={`email-auth-flow ${className || ""}`}
      style={containerStyle}
    >
      {/* Email Input Step */}
      {step === "email" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🐝</div>
            <h2
              style={{
                margin: 0,
                color: "#111111",
                fontSize: "24px",
                fontWeight: "700",
              }}
            >
              Join the Hive
            </h2>
            <p
              style={{
                margin: "8px 0 0 0",
                color: "#666666",
                fontSize: "16px",
              }}
            >
              Enter your email to get started
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <MailIcon size={20} color="#9ca3af" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isConnecting || isProcessing}
                  style={{
                    ...inputStyle,
                    borderColor: error
                      ? "#ef4444"
                      : email && isValidEmail(email)
                        ? "#10b981"
                        : "#e5e7eb",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ffc905";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error
                      ? "#ef4444"
                      : email && isValidEmail(email)
                        ? "#10b981"
                        : "#e5e7eb";
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !email || !isValidEmail(email) || isConnecting || isProcessing
              }
              style={{
                ...buttonStyle,
                opacity:
                  !email || !isValidEmail(email) || isConnecting || isProcessing
                    ? 0.6
                    : 1,
                cursor:
                  !email || !isValidEmail(email) || isConnecting || isProcessing
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isConnecting || isProcessing ? (
                <>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid transparent",
                      borderTop: "2px solid #111111",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Sending verification...
                </>
              ) : (
                <>
                  Continue with Email
                  <ArrowRightIcon size={18} />
                </>
              )}
            </button>

            {error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}
          </form>

          <div
            style={{ textAlign: "center", color: "#6b7280", fontSize: "14px" }}
          >
            We'll send you a verification link to complete sign-in
          </div>
        </div>
      )}

      {/* Email Verification Step */}
      {step === "verifying" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "16px",
                background: "#fff3cd",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            >
              <MailIcon size={48} color="#ffc905" />
            </div>
            <h3
              style={{
                margin: 0,
                color: "#111111",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              Check your email
            </h3>
            <p style={{ margin: "12px 0", color: "#666666", fontSize: "16px" }}>
              We've sent a verification link to
            </p>
            <p
              style={{
                margin: 0,
                color: "#111111",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {email}
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f9fafb",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
                lineHeight: "1.4",
              }}
            >
              Click the link in your email to complete sign-in. The link will
              expire in 10 minutes.
            </p>
          </div>

          <button onClick={resetForm} style={secondaryButtonStyle}>
            Use different email
          </button>
        </div>
      )}

      {/* Success Step */}
      {step === "complete" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "24px" }}>
            <CheckCircleIcon size={64} color="#10b981" />
          </div>
          <h3
            style={{
              margin: 0,
              color: "#111111",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            🐝 Welcome to the Hive!
          </h3>
          <p style={{ margin: "12px 0", color: "#666666", fontSize: "16px" }}>
            Your account has been successfully created
          </p>
          <div
            style={{
              margin: "20px 0",
              padding: "12px",
              background: "#f0f9ff",
              border: "1px solid #0ea5e9",
              borderRadius: "8px",
              color: "#0369a1",
              fontSize: "14px",
            }}
          >
            🚀 Redirecting to your profile...
          </div>
        </div>
      )}

      {/* Error Step */}
      {step === "error" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                filter: "grayscale(100%)",
              }}
            >
              🐝
            </div>
            <h3
              style={{
                margin: 0,
                color: "#dc2626",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              Authentication Failed
            </h3>
            {error && (
              <p
                style={{ margin: "12px 0", color: "#666666", fontSize: "16px" }}
              >
                {error}
              </p>
            )}
          </div>

          <button onClick={resetForm} style={buttonStyle}>
            Try Again
          </button>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
