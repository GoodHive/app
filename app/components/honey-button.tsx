"use client";

import { Tooltip } from "@nextui-org/tooltip";
import React, { ReactNode } from "react";

export type HoneyButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";
export type HoneyButtonSize = "sm" | "md" | "lg" | "xl";

interface HoneyButtonProps {
  children: ReactNode;
  variant?: HoneyButtonVariant;
  size?: HoneyButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  tooltip?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  loadingText?: string;
}

const LoadingSpinner = ({ size = "md" }: { size?: HoneyButtonSize }) => {
  const sizeMap = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  return (
    <div className={`${sizeMap[size]} animate-spin`}>
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export const HoneyButton: React.FC<HoneyButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  tooltip,
  onClick,
  type = "button",
  className = "",
  loadingText,
}) => {
  const baseClasses =
    "btn-honey inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variantClasses = {
    primary:
      "btn-honey-primary text-neutral-800 focus:ring-honey-primary shadow-honey hover:shadow-honey-lg",
    secondary:
      "btn-honey-secondary bg-white text-honey-dark border-2 border-honey-primary hover:bg-honey-lighter focus:ring-honey-primary",
    ghost:
      "btn-honey-ghost bg-transparent text-honey-dark border border-honey-primary hover:bg-honey-lighter focus:ring-honey-primary",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-full min-h-8",
    md: "px-6 py-3 text-base rounded-full min-h-11",
    lg: "px-8 py-4 text-lg rounded-full min-h-12",
    xl: "px-10 py-5 text-xl rounded-full min-h-14",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const buttonContent = (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClasses}
    >
      {loading && <LoadingSpinner size={size} />}

      {!loading && icon && iconPosition === "left" && (
        <span className="inline-flex items-center">{icon}</span>
      )}

      <span>{loading ? loadingText || "Loading..." : children}</span>

      {!loading && icon && iconPosition === "right" && (
        <span className="inline-flex items-center">{icon}</span>
      )}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <div className="inline-block">{buttonContent}</div>
      </Tooltip>
    );
  }

  return buttonContent;
};

// Specialized button components
export const SaveButton: React.FC<
  Omit<HoneyButtonProps, "variant" | "children"> & {
    saving?: boolean;
    children?: ReactNode;
  }
> = ({ saving = false, children, ...props }) => (
  <HoneyButton
    variant="secondary"
    loading={saving}
    loadingText="Saving..."
    icon={!saving ? <span>💾</span> : undefined}
    {...props}
  >
    {children || "Save Profile"}
  </HoneyButton>
);

export const SubmitButton: React.FC<
  Omit<HoneyButtonProps, "variant" | "children"> & {
    submitting?: boolean;
    children?: ReactNode;
  }
> = ({ submitting = false, children, ...props }) => (
  <HoneyButton
    variant="primary"
    loading={submitting}
    loadingText="Submitting..."
    icon={!submitting ? <span>🚀</span> : undefined}
    {...props}
  >
    {children || "Send for Review"}
  </HoneyButton>
);

export const ViewProfileButton: React.FC<
  Omit<HoneyButtonProps, "variant" | "children"> & { children?: ReactNode }
> = ({ children, ...props }) => (
  <HoneyButton variant="ghost" icon={<span>👁️</span>} {...props}>
    {children || "View Public Profile"}
  </HoneyButton>
);

export const AIGenerateButton: React.FC<
  Omit<HoneyButtonProps, "variant" | "children"> & {
    generating?: boolean;
    children?: ReactNode;
  }
> = ({ generating = false, children, ...props }) => (
  <HoneyButton
    variant="primary"
    loading={generating}
    loadingText="Generating..."
    icon={!generating ? <span>🤖</span> : undefined}
    {...props}
  >
    {children || "Generate with AI"}
  </HoneyButton>
);

// Button Group Component
interface HoneyButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
  spacing?: "tight" | "normal" | "loose";
}

export const HoneyButtonGroup: React.FC<HoneyButtonGroupProps> = ({
  children,
  className = "",
  orientation = "horizontal",
  spacing = "normal",
}) => {
  const orientationClasses = {
    horizontal: "flex flex-row flex-wrap",
    vertical: "flex flex-col",
  };

  const spacingClasses = {
    tight: "gap-2",
    normal: "gap-4",
    loose: "gap-6",
  };

  return (
    <div
      className={`${orientationClasses[orientation]} ${spacingClasses[spacing]} items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
};
