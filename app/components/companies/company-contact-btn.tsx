"use client";

import { MessageBoxModal } from "@components/message-box-modal";
import { Mail, MessageCircle, Sparkles } from "lucide-react";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import styles from "./company-contact-btn.module.scss";

interface Props {
  toEmail: string;
  toUserName: string;
}

export const CompanyContactBtn = ({ toEmail, toUserName }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupModal, setIsPopupModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { user_id, checkAuthAndShowConnectPrompt } = useAuthCheck();

  useEffect(() => {
    setIsVisible(true);

    // Listen for post-auth contact modal trigger
    const handleShowContactModal = (event: CustomEvent) => {
      if (user_id) {
        // User is now authenticated, show the contact modal
        onContactMeBtnClickHandler();
      }
    };

    window.addEventListener('show-contact-modal', handleShowContactModal as EventListener);

    return () => {
      window.removeEventListener('show-contact-modal', handleShowContactModal as EventListener);
    };
  }, [user_id]);

  const onContactMeBtnClickHandler = async () => {
    // Check if user is authenticated first
    if (!checkAuthAndShowConnectPrompt("contact this company", "contact", { toEmail, toUserName })) {
      return;
    }
    
    setIsLoading(true);
    const userDataResponse = await fetch(
      `/api/talents/my-profile?user_id=${user_id}`,
    );

    if (!userDataResponse.ok) {
      setIsLoading(false);
      toast.error("You don't have a talent profile yet! Please create one.");
    }

    const userProfile = await userDataResponse.json();
    if (!userProfile.approved) {
      setIsLoading(false);
      toast.error(
        "Only verified talent can contact company! Please wait for your profile to be verified.",
      );
      return;
    } else {
      setIsPopupModal(true);
    }
  };

  const onPopupModalCloseHandler = () => {
    setIsPopupModal(false);
    setIsLoading(false);
  };

  const onSubmitHandler = async (message: string) => {
    if (!message) {
      toast.error("Please complete the form!");
      return;
    }
    if (!user_id) {
      // This should not happen if checkAuthAndShowConnectPrompt passed
      // But keeping as fallback
      checkAuthAndShowConnectPrompt("send a message");
      return;
    }
    try {
      setIsPopupModal(false);
      const userDataResponse = await fetch(
        `/api/talents/my-profile?user_id=${user_id}`,
      );

      if (!userDataResponse.ok) {
        throw new Error(`HTTP error! status: ${userDataResponse.status}`);
      }

      const userProfile = await userDataResponse.json();
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: JSON.stringify({
          name: userProfile?.first_name,
          toUserName: toUserName,
          email: toEmail,
          type: "contact-company",
          subject: `Goodhive - ${userProfile?.first_name} send you a message`,
          userEmail: userProfile?.email,
          message,
          userProfile: `${window.location.origin}/talents/${user_id}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Something went wrong!");
      } else {
        setIsLoading(false);
        toast.success("Message sent successfully!");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className={styles.contactSection}>
      {/* Enhanced Contact Button */}
      <div className={styles.buttonContainer}>
        <button
          onClick={onContactMeBtnClickHandler}
          disabled={isLoading}
          className={styles.contactButton}
        >
          {/* Background Animation */}
          <div className={styles.backgroundAnimation}></div>

          {/* Honey Drip Effect */}
          <div className={styles.honeyDrip}></div>

          {/* Button Content */}
          <div className={styles.buttonContent}>
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                <span className={styles.text}>Connecting...</span>
              </>
            ) : (
              <>
                <Mail className={styles.icon} size={20} />
                <span className={styles.text}>Contact Company</span>
                <Sparkles className={styles.sparkles} size={16} />
              </>
            )}
          </div>

          {/* Floating Bees */}
          <div className={`${styles.floatingBee} ${styles.bee1}`}>🐝</div>
          <div className={`${styles.floatingBee} ${styles.bee2}`}>🐝</div>
        </button>

        {/* Glow Effect */}
        <div className={styles.glowEffect}></div>
      </div>

      {/* Additional Info */}
      <div className={styles.infoSection}>
        <p className={styles.conversationInfo}>
          <MessageCircle className={styles.icon} size={16} />
          <span className={styles.text}>
            Start a conversation with the hive
            <span>🐝</span>
          </span>
        </p>
        <div className={styles.responseTime}>
          <div className={styles.statusDot}></div>
          <span>Usually responds within 24 hours</span>
        </div>
      </div>

      {/* Enhanced Modal */}
      {isPopupModal && (
        <MessageBoxModal
          title="Write your message:"
          messageLengthLimit={30}
          onSubmit={onSubmitHandler}
          onClose={onPopupModalCloseHandler}
        />
      )}
    </div>
  );
};
