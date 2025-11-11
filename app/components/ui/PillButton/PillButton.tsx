"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./PillButton.module.scss";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  icon?: ReactNode;
  showArrow?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const PillButton = ({
  variant = "primary",
  size = "medium",
  icon,
  showArrow = false,
  fullWidth = false,
  children,
  className = "",
  ...props
}: PillButtonProps) => {
  return (
    <button
      className={`
        ${styles.pillButton}
        ${styles[variant]}
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ''}
        ${className}
      `}
      {...props}
    >
      <span className={styles.buttonContent}>
        {icon && <span className={styles.buttonIcon}>{icon}</span>}
        <span>{children}</span>
        {showArrow && <ArrowRight className={styles.arrowIcon} />}
      </span>
      <div className={styles.buttonOverlay}></div>
    </button>
  );
};