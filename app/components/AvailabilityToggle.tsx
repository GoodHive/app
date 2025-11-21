"use client";

import { FC, useEffect, useState } from "react";

interface AvailabilityToggleProps {
  checked?: boolean;
  onChange?: (name: string, checked: boolean) => void;
  name: string;
  disabled?: boolean;
  errorMessage?: string;
}

export const AvailabilityToggle: FC<AvailabilityToggleProps> = ({
  checked = false,
  onChange,
  name,
  disabled = false,
  errorMessage,
}) => {
  const [isAvailable, setIsAvailable] = useState(checked);

  useEffect(() => {
    setIsAvailable(checked);
  }, [checked]);

  const handleToggle = () => {
    if (disabled) return;

    const newValue = !isAvailable;
    setIsAvailable(newValue);

    if (onChange) {
      onChange(name, newValue);
    }
  };

  return (
    <div className="flex flex-col">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={isAvailable}
          onChange={handleToggle}
          disabled={disabled}
          className="sr-only peer"
        />
        {/* Modern Toggle Switch */}
        <div className={`
          relative w-14 h-7 rounded-full peer transition-all duration-300 ease-in-out
          ${isAvailable
            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg shadow-amber-200'
            : 'bg-gray-300 shadow-inner'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        `}>
          <div className={`
            absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-6 w-6 transition-all duration-300 ease-in-out shadow-md
            ${isAvailable ? 'transform translate-x-7 border-amber-300' : 'transform translate-x-0'}
          `} />
        </div>

        {/* Status Text with Icon */}
        <div className={`
          ml-4 flex items-center gap-2 text-base font-medium transition-colors duration-300
          ${isAvailable ? 'text-amber-700' : 'text-gray-600'}
        `}>
          <svg
            className={`w-4 h-4 transition-colors duration-300 ${isAvailable ? 'text-amber-600' : 'text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isAvailable ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span>
            {isAvailable ? 'Available for new opportunities' : 'Not currently seeking'}
          </span>
        </div>
      </label>

      {/* Error Message */}
      {errorMessage && (
        <span className="text-sm text-red-500 mt-2">{errorMessage}</span>
      )}

      {/* Hidden Input for Form Submission */}
      <input
        type="hidden"
        name={`${name}_hidden`}
        value={isAvailable ? "true" : "false"}
      />
    </div>
  );
};