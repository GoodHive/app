"use client";

import React from "react";
import { ProfileData } from "../talents/my-profile/page";

interface ProfileCompletionProgressProps {
  profileData: ProfileData;
  selectedSkills: string[];
  className?: string;
}

interface ProgressSection {
  id: string;
  label: string;
  icon: string;
  required: boolean;
  isComplete: boolean;
}

export const ProfileCompletionProgress: React.FC<ProfileCompletionProgressProps> = ({
  profileData,
  selectedSkills,
  className = "",
}) => {
  const progressSections: ProgressSection[] = [
    {
      id: "basic",
      label: "Basic Info",
      icon: "👤",
      required: true,
      isComplete: !!(profileData.first_name && profileData.last_name && profileData.email),
    },
    {
      id: "profile",
      label: "Profile Details",
      icon: "📋",
      required: true,
      isComplete: !!(profileData.title && profileData.description),
    },
    {
      id: "location",
      label: "Location",
      icon: "📍",
      required: true,
      isComplete: !!(profileData.country && profileData.city),
    },
    {
      id: "contact",
      label: "Contact Info",
      icon: "📞",
      required: true,
      isComplete: !!(profileData.phone_number && profileData.phone_country_code),
    },
    {
      id: "work",
      label: "Work Info",
      icon: "💼",
      required: true,
      isComplete: !!(profileData.about_work && profileData.rate),
    },
    {
      id: "skills",
      label: "Skills",
      icon: "🛠️",
      required: true,
      isComplete: selectedSkills.length > 0,
    },
    {
      id: "cv",
      label: "CV/Resume",
      icon: "📄",
      required: true,
      isComplete: !!(profileData.cv_url),
    },
    {
      id: "role",
      label: "Role Selection",
      icon: "🎯",
      required: true,
      isComplete: !!(profileData.talent || profileData.mentor || profileData.recruiter),
    },
    {
      id: "social",
      label: "Social Links",
      icon: "🌐",
      required: false,
      isComplete: !!(profileData.linkedin || profileData.github || profileData.portfolio || profileData.twitter),
    },
    {
      id: "image",
      label: "Profile Image",
      icon: "🖼️",
      required: false,
      isComplete: !!(profileData.image_url),
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: "💬",
      required: true,
      isComplete: !!(profileData.telegram),
    },
    {
      id: "availability",
      label: "Availability",
      icon: "⏰",
      required: false,
      isComplete: profileData.availability !== undefined,
    },
  ];

  const completedSections = progressSections.filter(section => section.isComplete);
  const requiredSections = progressSections.filter(section => section.required);
  const completedRequiredSections = requiredSections.filter(section => section.isComplete);
  
  const totalProgress = (completedSections.length / progressSections.length) * 100;
  const requiredProgress = (completedRequiredSections.length / requiredSections.length) * 100;

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "var(--success)";
    if (progress >= 70) return "var(--honey-primary)";
    if (progress >= 40) return "var(--honey-secondary)";
    return "var(--honey-accent)";
  };

  return (
    <div className={`bee-card p-6 animate-fade-in-up ${className}`}>
      {/* Header with Bee Mascot */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bee-mascot">🐝</div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">
              Building Your Hive
            </h2>
            <p className="text-sm text-neutral-600">
              {requiredProgress === 100 ? "Hive construction complete! 🎉" : "Let's complete your professional hive"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-honey-dark">
              {Math.round(totalProgress)}%
            </span>
            <span className="text-sm text-neutral-600">Complete</span>
          </div>
          <div className="w-20 h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${totalProgress}%`,
                background: `linear-gradient(90deg, ${getProgressColor(totalProgress)}, var(--honey-secondary))`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Hive Construction Progress */}
      <div className="progress-honeycomb-enhanced mb-6 relative">
        {/* Floating Honey Particles */}
        <div className="honey-particles">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="honey-particle"
              style={{
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        {/* Hive Cells */}
        {progressSections.map((section, index) => (
          <div
            key={section.id}
            className={`hive-cell ${section.isComplete ? 'filled' : ''}`}
            title={`${section.label} ${section.required ? '(Required)' : '(Optional)'}`}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {!section.isComplete && (
              <div className="text-xs opacity-60">
                {section.icon}
              </div>
            )}
          </div>
        ))}

        {/* Bee Progress Indicator */}
        <div
          className="bee-progress"
          style={{
            left: `${(completedSections.length / progressSections.length) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          🐝
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <span className="text-neutral-600">
            Required: {completedRequiredSections.length}/{requiredSections.length}
          </span>
          <span className="text-neutral-500">
            Optional: {completedSections.length - completedRequiredSections.length}/{progressSections.length - requiredSections.length}
          </span>
        </div>
        <div className="text-right">
          {requiredProgress === 100 ? (
            <span className="text-success font-semibold flex items-center gap-1">
              <span>🎉</span>
              Ready for Review!
            </span>
          ) : (
            <span className="text-neutral-600">
              {requiredSections.length - completedRequiredSections.length} required fields remaining
            </span>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      {requiredProgress < 100 && (
        <div className="mt-4 p-3 bg-honey-lighter rounded-lg border-l-4 border-honey-primary">
          <p className="text-sm text-honey-dark flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>
              Complete all required fields to submit your profile for review. 
              Optional fields help showcase your full potential!
            </span>
          </p>
        </div>
      )}
    </div>
  );
};