"use client";

import { useState, useEffect } from "react";
import Modal from "./modal";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  onVerificationSuccess: (user: any) => void;
}

export default function EmailVerificationModal({
  open,
  onClose,
  walletAddress,
  onVerificationSuccess,
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep("email");
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setResendTimer(0);
      setAttempts(0);
    }
  }, [open]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          walletAddress,
          purpose: "email_verification" 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("This email is already registered. Please login with your existing account.");
        } else if (response.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError(data.error || "Failed to send verification code");
        }
        return;
      }

      toast.success("Verification code sent to your email!");
      setStep("otp");
      setResendTimer(60); // 60 seconds before allowing resend
    } catch (error) {
      console.error("Email submission error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit) && newOtp.join("").length === 6) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get referral code from cookies if available
      const referralCode = Cookies.get("referralCode");
      
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
          walletAddress,
          referred_by: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError("Invalid or expired code. Please try again.");
          setAttempts(attempts + 1);
          if (attempts >= 2) {
            setError("Too many failed attempts. Please request a new code.");
            setStep("email");
          }
        } else {
          setError(data.error || "Verification failed");
        }
        return;
      }

      toast.success("Email verified successfully!");
      onVerificationSuccess(data.user);
      onClose();
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          walletAddress,
          purpose: "email_verification",
          resend: true 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to resend code");
        return;
      }

      toast.success("New verification code sent!");
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      setAttempts(0);
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {step === "email" ? "Verify Your Email" : "Enter Verification Code"}
          </h2>
          <p className="text-gray-600 text-center mt-2">
            {step === "email"
              ? "To complete your registration, please verify your email address."
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition duration-200"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => handleOtpSubmit()}
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verify Email
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setStep("email")}
                className="text-gray-600 hover:text-gray-800 transition"
                disabled={isLoading}
              >
                Change Email
              </button>
              
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isLoading}
                className="text-amber-600 hover:text-amber-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}