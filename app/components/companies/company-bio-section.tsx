"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./company-bio-section.module.scss";

import "react-quill/dist/quill.snow.css";
import "@/app/styles/rich-text.css";

interface TruncatedBioProps {
  text: string;
  maxLength?: number;
}

export const CompanyBio: React.FC<TruncatedBioProps> = ({
  text,
  maxLength = 200,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Remove HTML tags for length calculation
  const plainText = text?.replace(/<[^>]*>/g, "") || "";
  const shouldTruncate = plainText?.length > maxLength;

  // This is a simplistic approach to truncating HTML - a better solution would parse the HTML properly
  let displayHtml = text;
  if (!isExpanded && shouldTruncate) {
    const truncateIndex =
      text.indexOf(plainText.substring(maxLength, maxLength + 20)) || maxLength;
    displayHtml = text.substring(0, truncateIndex) + "...";
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${styles.bioContainer} ${isVisible ? styles.visible : styles.hidden}`}>
      {/* Clean Bio Container */}
      <div className={styles.bioCard}>
        {/* Content */}
        <div className={styles.contentContainer}>
          {/* Bio Text */}
          <div
            className={`${styles.bioText} ${
              isExpanded ? styles.expanded : styles.collapsed
            }`}
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />

          {/* Clean Show More/Less Button */}
          {shouldTruncate && (
            <div className={styles.toggleButtonContainer}>
              <button
                onClick={handleToggle}
                className={styles.toggleButton}
              >
                <span className={styles.buttonText}>
                  {isExpanded ? "Show Less" : "Read More"}
                </span>
                {isExpanded ? (
                  <ChevronUp className={`${styles.buttonIcon} ${styles.bounce}`} />
                ) : (
                  <ChevronDown className={`${styles.buttonIcon} ${styles.bounce}`} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Subtle Decorative Element */}
        <div className={styles.decorativeBee}>
          <span className={styles.beeIcon}>🐝</span>
        </div>
      </div>
    </div>
  );
};
