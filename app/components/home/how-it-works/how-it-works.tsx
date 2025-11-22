"use client";

import { ArrowRight, MessageCircle, Play, Sparkles, Users } from "lucide-react";
import { TRANSLATION } from "./how-it-works.constants";

export const HowItWorks = () => {
  const onJoinTodayClick = () => {
    window.open("https://discord.gg/5PU89fhn9b", "_blank");
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        {/* Floating Hexagons */}
        <div className="absolute top-20 left-12 w-20 h-20 transform rotate-45">
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-yellow-300 rounded-lg opacity-15 animate-pulse"></div>
        </div>
        <div className="absolute bottom-24 right-16 w-28 h-28 transform -rotate-45">
          <div
            className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 rounded-lg opacity-15 animate-pulse"
            style={{ animationDelay: "1.5s" }}
          ></div>
        </div>

        {/* Animated Bees */}
        <div className="absolute top-1/3 right-1/3 w-10 h-10 opacity-50">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          >
            <span className="text-3xl">🐝</span>
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/3 w-8 h-8 opacity-40">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "2.5s", animationDuration: "5s" }}
          >
            <span className="text-2xl">🐝</span>
          </div>
        </div>

        {/* Pollen Particles */}
        <div className="absolute top-32 right-24 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-30"></div>
        <div
          className="absolute bottom-40 left-24 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping opacity-25"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center bg-amber-100 text-amber-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            See the Magic in Action
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
            <span className="text-gray-900">How</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 mx-2">
              GoodHive
            </span>
            <span className="text-gray-900">Works</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4">
            {TRANSLATION.description}
          </p>
        </div>

        {/* Enhanced Video Section */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="relative group">
            {/* Video Container with Glow */}
            <div className="relative bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-2xl border border-amber-100">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
                <iframe
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/4ctDaQpfEEg?si=2HG1IOlBXr7bo6OE"
                  title="GoodHive: Revolutionizing Recruitment for Clients and Web3 Talent!"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full opacity-20 animate-pulse"></div>
            <div
              className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full opacity-20 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>

        {/* Enhanced Community Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl border border-amber-200">
            <div className="text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mr-4">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Join the Hive
                </h3>
              </div>

              <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed px-2">
                Connect with our buzzing community of developers, recruiters,
                and Web3 enthusiasts. Get exclusive updates, participate in
                discussions, and be part of the recruitment revolution!
              </p>

              {/* Stats */}
              {/* <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">1000+</div>
                    <div className="text-sm text-gray-600">Community Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">24/7</div>
                    <div className="text-sm text-gray-600">Active Support</div>
                  </div>
                }</div> */}

              <button
                onClick={onJoinTodayClick}
                className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden w-full sm:w-auto max-w-sm sm:max-w-none mx-auto"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Join our Discord Hive
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-8 sm:mt-12 px-4">
          <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border border-amber-200">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="font-semibold text-xs sm:text-sm md:text-base">
              Ready to buzz with the best? Join us today! 🍯
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
