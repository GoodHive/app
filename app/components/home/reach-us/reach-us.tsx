"use client";

import { MessagePopup } from "@components/message-popup";
import { MessageCircle, Phone, Sparkles } from "lucide-react";
import { useState } from "react";
import { TRANSLATION } from "./reach-us.constants";

export const ReachUs = () => {
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);

  const onContactUsClick = () => {
    window.open(
      "https://calendly.com/benoit-kulesza/virtual-coffe-10-mins",
      "_blank",
    );
  };

  const onMessageUsClick = () => {
    setIsMessagePopupOpen(true);
  };

  return (
    <>
      <section className="relative w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden">
        {/* Enhanced Decorative Background Elements */}
        <div className="absolute inset-0">
          {/* Honeycomb Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
              {Array.from({ length: 144 }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 border-2 border-amber-300 transform rotate-45"
                ></div>
              ))}
            </div>
          </div>

          {/* Animated Flying Bees */}
          <div className="absolute top-1/4 left-1/4 w-12 h-12 opacity-80">
            <div
              className="relative animate-bounce"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            >
              <span className="text-4xl">🐝</span>
            </div>
            <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-20">
              <div className="w-full h-full bg-amber-400 rounded-full"></div>
            </div>
          </div>

          <div className="absolute top-1/3 right-1/4 w-10 h-10 opacity-70">
            <div
              className="relative animate-bounce"
              style={{ animationDelay: "1.5s", animationDuration: "4s" }}
            >
              <span className="text-3xl">🐝</span>
            </div>
            <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-15">
              <div className="w-full h-full bg-amber-400 rounded-full"></div>
            </div>
          </div>

          <div className="absolute bottom-1/4 left-1/3 w-8 h-8 opacity-60">
            <div
              className="relative animate-bounce"
              style={{ animationDelay: "3s", animationDuration: "5s" }}
            >
              <span className="text-2xl">🐝</span>
            </div>
            <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-10">
              <div className="w-full h-full bg-amber-400 rounded-full"></div>
            </div>
          </div>

          {/* Moving Bee Trail */}
          <div className="absolute top-1/2 left-0 w-full h-1 overflow-hidden">
            <div
              className="absolute text-lg"
              style={{
                animation: "moveRight 8s linear infinite",
                animationDelay: "0s",
              }}
            >
              🐝
            </div>
            <div
              className="absolute text-sm"
              style={{
                animation: "moveRight 10s linear infinite",
                animationDelay: "2s",
              }}
            >
              🐝
            </div>
          </div>

          {/* Enhanced Hexagon Hives */}
          <div className="absolute top-16 right-16 w-32 h-32 transform rotate-45">
            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-yellow-300 rounded-lg opacity-20 animate-pulse relative overflow-hidden">
              <div className="absolute inset-4 bg-white bg-opacity-30 rounded-md"></div>
              <div className="absolute inset-8 bg-amber-400 bg-opacity-40 rounded-sm"></div>
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-bounce opacity-60"></div>
          </div>

          <div className="absolute bottom-20 left-16 w-40 h-40 transform -rotate-45">
            <div
              className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 rounded-lg opacity-15 animate-pulse relative overflow-hidden"
              style={{ animationDelay: "1s" }}
            >
              <div className="absolute inset-6 bg-white bg-opacity-30 rounded-md"></div>
              <div className="absolute inset-10 bg-orange-400 bg-opacity-40 rounded-sm"></div>
            </div>
            <div
              className="absolute -bottom-3 -left-3 w-6 h-6 bg-orange-500 rounded-full animate-bounce opacity-50"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          {/* Floating Pollen Particles */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-40"></div>
          <div
            className="absolute top-32 right-32 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-30"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping opacity-25"
            style={{ animationDelay: "2.5s" }}
          ></div>
          <div
            className="absolute bottom-20 right-20 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-35"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        {/* Custom CSS for bee movement */}
        <style jsx>{`
          @keyframes moveRight {
            0% {
              left: -10px;
            }
            100% {
              left: 100%;
            }
          }
        `}</style>

        <div className="relative container mx-auto px-6 py-20 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center">
              {/* Left Content */}
              <div className="text-center">
                {/* Badge */}
                <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Direct Communication
                </div>

                {/* Title */}
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Let's Create Some
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">
                    Honey Magic
                  </span>
                  Together!
                </h2>

                {/* Description */}
                <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-lg mx-auto">
                  {TRANSLATION.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 mb-10 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      24h
                    </div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      100%
                    </div>
                    <div className="text-sm text-gray-600">Dedicated Support</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={onMessageUsClick}
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Send us a Message
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>

                  <button
                    type="button"
                    onClick={onContactUsClick}
                    className="group px-8 py-4 bg-white text-amber-600 font-semibold rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      <Phone className="w-5 h-5 mr-2" />
                      Book a Hive Call
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-[-20px] left-0 w-full">
          <svg
            className="w-full h-16 fill-current text-amber-100"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
            ></path>
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
            ></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Message Popup */}
      <MessagePopup
        isOpen={isMessagePopupOpen}
        onClose={() => setIsMessagePopupOpen(false)}
      />
    </>
  );
};
