"use client";

import { Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "../modal";
import styles from "./OnboardingPopup.module.scss";

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  videoUrl?: string;
  title?: string;
  description?: string;
}

const OnboardingPopup = ({
  isOpen,
  onClose,
  onContinue,
  videoUrl = "https://www.youtube.com/watch?v=4ep_oZ0khzo",
  title = "Welcome To GoodHive!",
  description = "Let's get you started with creating your talent profile.",
}: OnboardingPopupProps) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    onContinue();
    router.push("/talents/my-profile");
  };

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className={styles.popup}>
        <button
          aria-label="Close popup"
          className={styles.closeBtn}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className={styles.videoWrapper}>
          {!isVideoLoaded && (
            <div className={styles.videoLoading}>
              <Play size={28} />
            </div>
          )}
          <iframe
            src={embedUrl}
            title="Onboarding Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsVideoLoaded(true)}
          />
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={handleContinue}>
              Create Talent Profile
            </button>
            <button className={styles.secondaryBtn} onClick={onClose}>
              No, I Will Do It Later
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingPopup;
