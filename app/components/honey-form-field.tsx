"use client";

import React, { ReactNode, useState, useId } from "react";
import { Tooltip } from "@nextui-org/tooltip";

interface HoneyFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
}

export const HoneyFormField: React.FC<HoneyFormFieldProps> = ({
  label,
  required = false,
  error,
  help,
  tooltip,
  children,
  className = "",
}) => {
  return (
    <div className={`form-field-honey ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-base font-semibold text-neutral-700">
          {label}
          {required && <span className="text-honey-accent ml-1">*</span>}
        </label>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-honey-primary text-xs text-neutral-800 cursor-help font-bold">
              ?
            </span>
          </Tooltip>
        )}
      </div>
      
      {children}
      
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-slide-in-right">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {help && !error && (
        <p className="mt-2 text-sm text-neutral-500 flex items-center gap-1">
          <span>💡</span>
          {help}
        </p>
      )}
    </div>
  );
};

interface HoneyInputProps {
  type?: "text" | "email" | "tel" | "number" | "password" | "url";
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const HoneyInput: React.FC<HoneyInputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  maxLength,
  pattern,
  min,
  max,
  step,
  className = "",
  id,
  name,
  autoComplete,
  icon,
  iconPosition = "left",
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  const baseClasses = "input-honey peer";
  const iconClasses = icon ? (iconPosition === "left" ? "pl-12" : "pr-12") : "";
  const combinedClasses = [baseClasses, iconClasses, className].filter(Boolean).join(" ");

  return (
    <div className="relative">
      {icon && iconPosition === "left" && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 z-10">
          {icon}
        </div>
      )}
      
      <input
        type={type}
        id={inputId}
        name={name}
        className={combinedClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        pattern={pattern}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
      />
      
      {icon && iconPosition === "right" && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 z-10">
          {icon}
        </div>
      )}
    </div>
  );
};

interface HoneyTextAreaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
  id?: string;
  name?: string;
  resize?: boolean;
}

export const HoneyTextArea: React.FC<HoneyTextAreaProps> = ({
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  className = "",
  id,
  name,
  resize = true,
}) => {
  const generatedId = useId();
  const textareaId = id || generatedId;

  const baseClasses = "input-honey rounded-2xl";
  const resizeClass = resize ? "resize-y" : "resize-none";
  const combinedClasses = [baseClasses, resizeClass, className].filter(Boolean).join(" ");

  return (
    <div className="relative">
      <textarea
        id={textareaId}
        name={name}
        className={combinedClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
      />
      {maxLength && (
        <div className="absolute bottom-3 right-3 text-xs text-neutral-400">
          {(value?.toString().length || 0)}/{maxLength}
        </div>
      )}
    </div>
  );
};

interface HoneySelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  children: ReactNode;
}

export const HoneySelect: React.FC<HoneySelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  id,
  name,
  children,
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  const baseClasses = "input-honey appearance-none cursor-pointer";
  const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

  return (
    <div className="relative">
      <select
        id={selectId}
        name={name}
        className={combinedClasses}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-5 h-5 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};

interface HoneyToggleProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const HoneyToggle: React.FC<HoneyToggleProps> = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  tooltip,
  className = "",
  id,
  name,
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const generatedId = useId();
  const toggleId = id || generatedId;

  const handleToggle = () => {
    if (disabled) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const toggleContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        id={toggleId}
        name={name}
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          toggle-honey relative focus:outline-none focus:ring-2 focus:ring-honey-primary focus:ring-offset-2 transition-all duration-200
          ${isChecked ? 'active' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        `}
      />
      <label
        htmlFor={toggleId}
        className={`text-base text-neutral-700 ${disabled ? 'text-neutral-400' : 'cursor-pointer'}`}
      >
        {label}
      </label>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <div className="inline-block">
          {toggleContent}
        </div>
      </Tooltip>
    );
  }

  return toggleContent;
};

interface HoneyFileUploadProps {
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  children?: ReactNode;
  dragAndDrop?: boolean;
}

export const HoneyFileUpload: React.FC<HoneyFileUploadProps> = ({
  accept,
  multiple = false,
  onChange,
  disabled = false,
  className = "",
  id,
  name,
  children,
  dragAndDrop = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && onChange) {
      onChange(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.files);
    }
  };

  if (dragAndDrop) {
    return (
      <div
        className={`
          dropzone-honey ${isDragOver ? 'dragover' : ''} ${className}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById(inputId)?.click()}
      >
        <input
          type="file"
          id={inputId}
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        {children || (
          <div className="text-center">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-semibold text-neutral-700 mb-2">
              Drop your files here or click to browse
            </p>
            <p className="text-sm text-neutral-500">
              {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        id={inputId}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="input-honey file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-honey-light file:text-honey-dark hover:file:bg-honey-primary"
      />
    </div>
  );
};

// Character counter component
interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  className = "",
}) => {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 80;
  const isError = percentage > 100;

  const color = isError 
    ? "text-red-500" 
    : isWarning 
    ? "text-honey-accent" 
    : "text-neutral-500";

  return (
    <div className={`text-right text-sm ${color} ${className}`}>
      <span>{current}/{max}</span>
      {isError && <span className="ml-1">⚠️</span>}
    </div>
  );
};