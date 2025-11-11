"use client";

import { X, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { useState } from "react";
import Modal from "../modal";
import styles from "./TalentVerificationPopup.module.scss";

interface TalentVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueToOnboarding: () => void;
  jobTitle: string;
  companyName: string;
}

const TalentVerificationPopup = ({
  isOpen,
  onClose,
  onContinueToOnboarding,
  jobTitle,
  companyName,
}: TalentVerificationPopupProps) => {
  const [showOnboardingStep, setShowOnboardingStep] = useState(false);

  const handleContinueToVideo = () => {
    setShowOnboardingStep(true);
    // Small delay to show the step transition, then proceed to onboarding
    setTimeout(() => {
      onContinueToOnboarding();
    }, 300);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      disableOutsideClick={true}
      blurIntensity="medium"
    >
      <div className={styles.popup}>
        <button
          aria-label="Close popup"
          className={styles.closeBtn}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <AlertCircle className={styles.alertIcon} size={32} />
          </div>
          <h2 className={styles.title}>Profile Verification Required</h2>
          <p className={styles.subtitle}>
            Complete your talent profile to apply for jobs
          </p>
        </div>

        {/* Job Info Section */}
        <div className={styles.jobInfo}>
          <p className={styles.jobInfoText}>
            You're interested in: <span className={styles.jobTitle}>{jobTitle}</span>
          </p>
          <p className={styles.companyText}>at {companyName}</p>
        </div>

        {/* Steps Section */}
        <div className={styles.stepsSection}>
          <h3 className={styles.stepsTitle}>To apply for this position:</h3>

          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={`${styles.stepIcon} ${showOnboardingStep ? styles.completed : styles.active}`}>
                <CheckCircle2 size={16} />
              </div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Create Your Talent Profile</h4>
                <p className={styles.stepDescription}>
                  Add your skills, experience, and portfolio
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={`${styles.stepIcon} ${showOnboardingStep ? styles.active : ''}`}>
                <Play size={16} />
              </div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Watch Quick Tutorial</h4>
                <p className={styles.stepDescription}>
                  Learn how to create an impressive profile (2 min)
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <CheckCircle2 size={16} />
              </div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Get Verified & Apply</h4>
                <p className={styles.stepDescription}>
                  Once approved, apply to any job on GoodHive
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={handleContinueToVideo}
            disabled={showOnboardingStep}
          >
            {showOnboardingStep ? (
              <>
                <div className={styles.spinner}></div>
                Loading Tutorial...
              </>
            ) : (
              <>
                <Play size={16} />
                Watch Tutorial & Get Started
              </>
            )}
          </button>

          <button
            className={styles.secondaryBtn}
            onClick={onClose}
            disabled={showOnboardingStep}
          >
            Maybe Later
          </button>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            <span className={styles.footerIcon}>🍯</span>
            Join 1000+ verified talents on GoodHive
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TalentVerificationPopup;