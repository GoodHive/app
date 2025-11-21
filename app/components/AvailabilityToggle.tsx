"use client";

import { FC, useEffect, useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

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
    <div className="flex flex-col items-center space-y-3">
      {/* Modern Toggle Switch */}
      <div
        onClick={handleToggle}
        className={`
          relative inline-flex items-center cursor-pointer transition-all duration-300 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        <div className="flex flex-col items-center space-y-3">
          {/* Status Indicator */}
          <div className={`
            flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all duration-300 ease-in-out shadow-lg
            ${isAvailable
              ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-green-200'
              : 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-400 shadow-amber-200'
            }
          `}>
            {isAvailable ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600" />
            )}
          </div>

          {/* Toggle Switch */}
          <div className={`
            relative w-16 h-8 rounded-full border-2 transition-all duration-300 ease-in-out shadow-inner
            ${isAvailable
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-300'
              : 'bg-gradient-to-r from-gray-300 to-gray-400 border-gray-300'
            }
          `}>
            <div className={`
              absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out
              ${isAvailable ? 'transform translate-x-8' : 'transform translate-x-0'}
            `} />
          </div>

          {/* Status Text */}
          <div className="text-center">
            <div className={`
              font-semibold text-lg transition-colors duration-300
              ${isAvailable ? 'text-green-700' : 'text-amber-700'}
            `}>
              {isAvailable ? 'Available' : 'Not Available'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {isAvailable ? 'Open to new opportunities' : 'Currently not seeking'}
            </div>
          </div>
        </div>

        {/* Subtle Animation Ring */}
        <div className={`
          absolute inset-0 rounded-full border-2 border-opacity-30 transition-all duration-300
          ${isAvailable
            ? 'border-green-400 animate-pulse'
            : 'border-amber-400'
          }
        `} />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-red-500 text-sm text-center bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Hidden Input for Form Submission */}
      <input
        type="hidden"
        name={name}
        value={isAvailable ? "true" : "false"}
      />
    </div>
  );
};