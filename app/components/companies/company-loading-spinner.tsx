"use client";

import { useEffect, useState } from "react";

interface CompanyLoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  subMessage?: string;
}

export const CompanyLoadingSpinner = ({
  size = "medium",
  message = "Loading company profile...",
  subMessage = "Gathering the latest details 🍯",
}: CompanyLoadingSpinnerProps) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    small: "h-12 w-12",
    medium: "h-20 w-20",
    large: "h-32 w-32",
  };

  const dotClasses = {
    small: "w-2 h-2",
    medium: "w-3 h-3", 
    large: "w-4 h-4",
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100">
      <div className="text-center space-y-6 animate-scale-in-center">
        {/* Enhanced Spinner */}
        <div className="relative">
          {/* Main Spinner Ring */}
          <div className={`${sizeClasses[size]} mx-auto relative`}>
            <div className="absolute inset-0 rounded-full border-4 border-[#FFC905]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#FFC905] border-r-[#FFB800] border-b-transparent border-l-transparent animate-spin"></div>
            
            {/* Inner Honeycomb */}
            <div className="absolute inset-2 flex items-center justify-center">
              <div className="relative">
                <div
                  className="w-8 h-8 bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-[#FFC905] shadow-sm"
                  style={{
                    clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                  }}
                >
                </div>
                {/* Animated Bee in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg animate-bounce">🐝</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating Particles */}
          <div className="absolute -top-4 -left-4">
            <div className={`${dotClasses[size]} bg-amber-400 rounded-full animate-float opacity-60`}></div>
          </div>
          <div className="absolute -top-2 -right-6">
            <div className={`${dotClasses[size]} bg-yellow-400 rounded-full animate-float-slow opacity-50`} style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="absolute -bottom-4 -right-4">
            <div className={`${dotClasses[size]} bg-orange-400 rounded-full animate-float opacity-40`} style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="space-y-3 max-w-md">
          <h3 className="text-xl font-semibold text-gray-800 animate-pulse">
            {message}
          </h3>
          
          {/* Animated Loading Dots */}
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-600">{subMessage}</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`w-2 h-2 bg-[#FFC905] rounded-full transition-opacity duration-300 ${
                    animationPhase === index ? 'opacity-100 animate-bounce' : 'opacity-30'
                  }`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Progress Indication */}
          <div className="mt-6">
            <div className="w-64 h-2 bg-amber-100 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-shimmer"></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Setting up the hive...</p>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-1/4 left-1/4 opacity-10">
          <div className="w-16 h-16 animate-float-slow">
            <span className="text-4xl">🍯</span>
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/4 opacity-10">
          <div className="w-12 h-12 animate-float" style={{ animationDelay: '1.5s' }}>
            <span className="text-3xl">🐝</span>
          </div>
        </div>
      </div>
    </div>
  );
};
