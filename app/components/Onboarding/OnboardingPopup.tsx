"use client";

import React, { useState } from "react";
import Modal from "./Modal/Modal";
import ProfileTypeSelector, { ProfileType } from "./ProfileTypeSelector";
import VideoTutorials from "./VideoTutorials";
import { ArrowLeft } from "lucide-react";
import "./OnboardingPopup.css";
import { useRouter } from "next/navigation";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose?: () => void;
}

type Step = "type" | "tutorials" | "video" | "success";

const OnboardingPopup: React.FC<OnboardingPopupProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { navigate: protectedNavigate } = useProtectedNavigation();
  const [profileType, setProfileType] = useState<ProfileType>("talent");
  const [step, setStep] = useState<Step>("type");
  const [currentVideo, setCurrentVideo] = useState(0);

  const handleProfileTypeSelect = (type: ProfileType) => {
    setProfileType(type);
  };

  const handleContinue = () => {
    setStep("tutorials");
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideo(index);
    setStep("video");
  };

  const handleNext = () => {
    if (step === "video") {
      if (currentVideo < 2) {
        setCurrentVideo(currentVideo + 1);
      } else {
        setStep("success");
      }
    }
  };

  const handleRestart = () => {
    setStep("type");
    setCurrentVideo(0);
    setProfileType("talent");
  };

  const handleGoToDashboard = () => {
    if (onClose) onClose();

    if (profileType === "talent") {
      protectedNavigate("/talents/my-profile", {
        authDescription: "access your talent profile"
      });
    } else {
      protectedNavigate("/companies/my-profile", {
        authDescription: "access your company profile"
      });
    }
  };

  const renderContent = () => {
    switch (step) {
      case "type":
        return (
          <div className="flex flex-col items-center h-full justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">
              Choose Your Profile Type
            </h1>
            <p className="text-gray-600 mb-8">
              Select whether you want to create a talent profile or a company
              profile.
              <br />
              We'll guide you through the process.
            </p>
            <ProfileTypeSelector
              selectedType={profileType}
              onSelectType={handleProfileTypeSelect}
              onContinue={handleContinue}
            />
          </div>
        );

      case "tutorials":
        return (
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={() => setStep("type")}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">
                {profileType === "talent"
                  ? "Talent Profile Tutorials"
                  : "Company Profile Tutorials"}
              </h1>
            </div>
            <VideoTutorials
              profileType={profileType}
              onVideoSelect={handleVideoSelect}
            />
          </>
        );

      case "video":
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setStep("tutorials")}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Step {currentVideo + 1} of 3
                </h1>
                <p className="text-gray-600">
                  {profileType === "talent"
                    ? "Talent Profile Creation"
                    : "Company Profile Creation"}
                </p>
              </div>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {/* Video player would go here */}
              <div className="w-full h-full flex items-center justify-center text-white">
                Video {currentVideo + 1}
              </div>
            </div>

            <p className="text-gray-600">
              {getVideoDescription(currentVideo, profileType)}
            </p>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-[#FFC905] text-black rounded-lg hover:bg-[#FFD935] transition-colors"
            >
              {currentVideo < 2 ? "Next Video" : "Complete Setup"}
            </button>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full mx-auto flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold text-gray-800">
              Setup Complete!
            </h1>

            <p className="text-gray-600">
              You've completed all the tutorial videos. You're now ready to
              {profileType === "talent"
                ? " start finding opportunities"
                : " start posting jobs and finding talent"}
              .
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-[#FFC905] text-black rounded-lg hover:bg-[#FFD935] transition-colors"
                type="button"
              >
                Go to {profileType === "talent" ? "Talent" : "Company"}{" "}
                Dashboard
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="registration-popup">
        <div className="registration-left-panel">
          <div className="registration-logo">
            <div className="logo-icon">G</div>
            <span className="logo-text">GoodHive</span>
          </div>

          <div className="registration-left-content">
            <h2>Welcome to GoodHive!</h2>
            <p>
              Let's get you started with creating your
              {profileType === "talent" ? " talent" : " company"} profile.
            </p>
          </div>
        </div>
        <div className="registration-right-panel flex flex-col items-center h-full justify-center">
          <div className="registration-content">{renderContent()}</div>
        </div>
      </div>
    </Modal>
  );
};

const getVideoDescription = (index: number, type: ProfileType) => {
  const descriptions = {
    talent: [
      "Learn how to create an engaging talent profile that showcases your skills and experience.",
      "Discover how to effectively highlight your achievements and make your profile stand out.",
      "Find out how to search and apply for opportunities that match your skills.",
    ],
    company: [
      "Learn how to create a professional company profile that attracts top talent.",
      "Discover how to create compelling job postings and manage applications.",
      "Find out how to effectively review and communicate with potential candidates.",
    ],
  };

  return descriptions[type][index];
};

export default OnboardingPopup;
