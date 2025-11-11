import React, { FC, useState, useEffect } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import styles from "./message-box-modal.module.scss";

interface Props {
  title: string;
  messageLengthLimit: number;
  onSubmit: (coverLetter: string) => void;
  onClose: () => void;
}

export const MessageBoxModal: FC<Props> = (props) => {
  const { title, messageLengthLimit, onClose, onSubmit } = props;
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleClose = () => {
    setIsVisible(false);
    // Delay actual close to allow exit animation
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const onClickSubmitHandler = async () => {
    if (message.length < messageLengthLimit) {
      return; // Character count will show validation
    }

    setIsSubmitting(true);
    try {
      await onSubmit(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = message.length >= messageLengthLimit;
  const characterCountClass = message.length >= messageLengthLimit ? styles.valid : styles.invalid;

  return (
    <div
      className={`${styles.modalOverlay} ${isVisible ? styles.modalEntering : styles.modalExiting}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modalContainer}>
        {/* Floating Bees Decoration */}
        <div className={styles.floatingBees}>
          <span className={`${styles.bee} ${styles.bee1}`}>🐝</span>
          <span className={`${styles.bee} ${styles.bee2}`}>🐝</span>
          <span className={`${styles.bee} ${styles.bee3}`}>🐝</span>
        </div>

        {/* Enhanced Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconContainer}>
              <span className={styles.beeIcon}>🍯</span>
            </div>
            <div className={styles.titleSection}>
              <h2 id="modal-title" className={styles.title}>
                Contact Company
              </h2>
              <p className={styles.subtitle}>
                Send a message to the hive
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <div className={styles.inputSection}>
            <label htmlFor="message-textarea" className={styles.label}>
              Your Message
            </label>
            <textarea
              id="message-textarea"
              className={styles.textarea}
              placeholder="Share your thoughts, introduce yourself, or ask about opportunities. Make it personal and engaging..."
              value={message}
              onChange={handleChange}
              rows={6}
            />
            <div className={styles.characterCount}>
              <span className={styles.requirement}>
                Minimum {messageLengthLimit} characters required
              </span>
              <span className={`${styles.count} ${characterCountClass}`}>
                {message.length}/{messageLengthLimit}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={onClickSubmitHandler}
            disabled={!isValid || isSubmitting}
          >
            <span className={styles.buttonContent}>
              {isSubmitting ? (
                <>
                  <div className={styles.loadingSpinner} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
