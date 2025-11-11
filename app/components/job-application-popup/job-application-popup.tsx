"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
import styles from "./job-application-popup.module.scss";

interface JobApplicationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  companyEmail: string;
  jobId: string; // UUID string
  walletAddress: string;
}

interface FormData {
  name: string;
  email: string;
  coverLetter: string;
  portfolioLink?: string;
}

const schema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  coverLetter: yup
    .string()
    .required("Cover letter is required")
    .min(200, "Cover letter must be at least 200 characters"),
  portfolioLink: yup.string().optional().url("Please enter a valid URL"),
});

export const JobApplicationPopup: React.FC<JobApplicationPopupProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  companyEmail,
  jobId,
  walletAddress,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const logged_in_user_id = Cookies.get("user_id");

  // Component-based class management
  const getOverlayClasses = () => {
    return `${styles.jobApplicationOverlay} ${
      isOpen ? styles.entered : styles.exiting
    }`;
  };

  const getModalClasses = () => {
    return styles.jobApplicationModal;
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const coverLetterValue = watch("coverLetter", "");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Get user profile data
      const userDataResponse = await fetch(
        `/api/talents/my-profile?user_id=${logged_in_user_id}`,
      );

      if (!userDataResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userProfile = await userDataResponse.json();

      // Prepare email data
      const emailData = {
        name: data.name,
        toUserName: companyName,
        email: companyEmail,
        type: "job-applied",
        subject: `🍯 GoodHive - ${data.name} applied for "${jobTitle}"`,
        userEmail: data.email,
        message: `${data.coverLetter}${data.portfolioLink ? `\n\nPortfolio/LinkedIn: ${data.portfolioLink}` : ""}`,
        userProfile: `${window.location.origin}/talents/${logged_in_user_id}`,
        jobLink: `${window.location.origin}/companies/${walletAddress}?id=${jobId}`,
      };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        toast.success(
          "🍯 Application sent successfully! The company will buzz back to you soon!",
        );
        reset();
        onClose();
      } else {
        throw new Error("Failed to send application");
      }
    } catch (error) {
      console.error("Error sending application:", error);
      toast.error("Failed to send application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className={getOverlayClasses()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={getModalClasses()}>
        {/* Decorative Header with Honeycomb Pattern */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 p-8 rounded-t-3xl overflow-hidden">
          {/* Honeycomb Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="grid grid-cols-6 gap-2 transform rotate-12 scale-150 -translate-x-4 -translate-y-4">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 border-2 border-amber-300 transform rotate-45"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Bees */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-4 left-12 animate-bounce"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            >
              <span className="text-lg">🐝</span>
            </div>
            <div
              className="absolute top-8 right-20 animate-bounce"
              style={{ animationDelay: "1s", animationDuration: "4s" }}
            >
              <span className="text-lg">🐝</span>
            </div>
            <div
              className="absolute bottom-4 left-20 animate-bounce"
              style={{ animationDelay: "2s", animationDuration: "3.5s" }}
            >
              <span className="text-lg">🐝</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-200"
            disabled={isSubmitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header Content */}
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full mb-4">
              <span className="text-3xl">🍯</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Apply for Position
            </h2>
            <p className="text-amber-100 text-sm">
              Join the hive at {companyName}
            </p>
            <div className="mt-3 inline-block bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-white font-medium text-sm">{jobTitle}</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                Your Name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Enter your full name..."
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Portfolio Link Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Portfolio/LinkedIn (Optional)
              </label>
              <input
                {...register("portfolioLink")}
                type="url"
                placeholder="https://your-portfolio.com or LinkedIn profile..."
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              {errors.portfolioLink && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.portfolioLink.message}
                </p>
              )}
            </div>

            {/* Cover Letter Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Cover Letter
              </label>
              <textarea
                {...register("coverLetter")}
                rows={8}
                placeholder="Tell us about yourself and why you're perfect for this role. Share your experience, passion, and what makes you a great fit for our hive..."
                className="w-full px-4 py-3 border-2 border-amber-100 rounded-xl focus:border-amber-400 focus:ring-0 bg-amber-50/30 text-gray-800 placeholder-gray-500 font-medium resize-none transition-all duration-200 hover:bg-amber-50/50"
                disabled={isSubmitting}
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Minimum 200 characters required
                </span>
                <span
                  className={`text-xs font-medium ${coverLetterValue.length >= 200 ? "text-green-600" : "text-red-500"}`}
                >
                  {coverLetterValue.length}/200
                </span>
              </div>
              {errors.coverLetter && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.coverLetter.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-full hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending Application...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🍯</span>
                    Apply Now
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-amber-100 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <span className="mr-1">🔒</span>
              Your application will be sent directly to the company
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};
