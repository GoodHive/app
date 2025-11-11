"use client";

import React from "react";

interface BeeHiveSpinnerProps {
  size?: "small" | "default" | "large";
  className?: string;
  style?: React.CSSProperties;
  loadingText?: string;
}

export default function BeeHiveSpinner({
  size = "default",
  className = "",
  style = {},
  loadingText = "Loading...",
}: BeeHiveSpinnerProps) {
  const containerSizes = {
    small: "w-20 h-20",
    default: "w-32 h-32",
    large: "w-40 h-40",
  };

  const hiveSizes = {
    small: "w-16 h-14",
    default: "w-24 h-21",
    large: "w-32 h-28",
  };

  const beeSizes = {
    small: "text-sm",
    default: "text-lg",
    large: "text-xl",
  };

  const textSizes = {
    small: "text-xs",
    default: "text-sm",
    large: "text-base",
  };

  const orbitRadius = {
    small: "32px",
    default: "48px", 
    large: "64px",
  };

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(10deg);
          }
        }
        
        @keyframes hiveGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
          }
        }
        
        .bee-float-1 {
          animation: float 2s ease-in-out infinite;
        }
        
        .bee-float-2 {
          animation: float 2.2s ease-in-out infinite;
          animation-delay: 0.7s;
        }
        
        .bee-float-3 {
          animation: float 1.8s ease-in-out infinite;
          animation-delay: 1.4s;
        }
        
        .hive-glow {
          animation: hiveGlow 3s ease-in-out infinite;
        }
      `}</style>
      
      <div
        className={`flex flex-col items-center justify-center min-h-screen ${className}`}
        style={style}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
            {/* Hexagonal Hive Structure */}
            <div className={`relative ${hiveSizes[size]} flex items-center justify-center`}>
              {/* Outer glow effect */}
              <div
                className="absolute hive-glow rounded-full"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  width: "110%",
                  height: "110%",
                  background: "linear-gradient(45deg, #fcd34d, #f59e0b)",
                }}
              />
              
              {/* Main hexagon hive */}
              <div
                className="absolute bg-gradient-to-br from-amber-200 to-amber-400 animate-pulse"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  width: "100%",
                  height: "100%",
                  animationDuration: "2.5s",
                }}
              />
              
              {/* Inner hexagon */}
              <div
                className="absolute bg-gradient-to-br from-amber-300 to-amber-500"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  width: "75%",
                  height: "75%",
                }}
              />
              
              {/* Center hexagon with honey color */}
              <div
                className="absolute bg-gradient-to-br from-amber-400 to-amber-600"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  width: "50%",
                  height: "50%",
                }}
              />
              
              {/* Center highlight */}
              <div
                className="absolute bg-yellow-200 opacity-80"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  width: "30%",
                  height: "30%",
                }}
              />
            </div>

            {/* Flying Bees with better positioning */}
            <div className={`absolute ${beeSizes[size]}`}>
              {/* Bee 1 - top orbit */}
              <div
                className="absolute animate-spin"
                style={{
                  animationDuration: "4s",
                  transformOrigin: "center",
                }}
              >
                <div 
                  className="absolute bee-float-1"
                  style={{
                    left: orbitRadius[size],
                    top: "0px",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  🐝
                </div>
              </div>

              {/* Bee 2 - middle orbit */}
              <div
                className="absolute animate-spin"
                style={{
                  animationDuration: "3.5s",
                  animationDirection: "reverse",
                  transformOrigin: "center",
                }}
              >
                <div 
                  className="absolute bee-float-2"
                  style={{
                    left: `calc(-${orbitRadius[size]} * 0.8)`,
                    top: `calc(${orbitRadius[size]} * 0.6)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  🐝
                </div>
              </div>

              {/* Bee 3 - bottom orbit */}
              <div
                className="absolute animate-spin"
                style={{
                  animationDuration: "4.5s",
                  transformOrigin: "center",
                }}
              >
                <div 
                  className="absolute bee-float-3"
                  style={{
                    left: `calc(${orbitRadius[size]} * 0.7)`,
                    top: orbitRadius[size],
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  🐝
                </div>
              </div>
            </div>
          </div>

          {/* Loading text with better styling */}
          <div className="text-center">
            <p className={`text-amber-600 font-semibold ${textSizes[size]} animate-pulse tracking-wide`}>
              {loadingText}
            </p>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}