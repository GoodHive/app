import { ExternalLink, Mail, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { contactDetails, pageLinks, socialLinks } from "./footer.constants";

export const Footer = () => {
  return (
    <footer className="relative w-full bg-gradient-to-br from-gray-900 via-amber-900 to-yellow-900 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        {/* Honeycomb Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
            {Array.from({ length: 96 }, (_, i) => (
              <div
                key={i}
                className="w-6 h-6 border-2 border-amber-300 transform rotate-45"
              ></div>
            ))}
          </div>
        </div>

        {/* Floating Bees */}
        <div className="absolute top-12 right-12 w-8 h-8 opacity-60">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "4s" }}
          >
            <span className="text-2xl">🐝</span>
          </div>
        </div>

        <div className="absolute bottom-20 left-16 w-6 h-6 opacity-40">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          >
            <span className="text-xl">🐝</span>
          </div>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-16 right-20 w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full opacity-10 blur-xl"></div>
      </div>

      <div className="relative container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-6">
              <Image
                src="/img/goodhive_light_logo.png"
                alt="GoodHive Logo"
                width={200}
                height={49}
                className="brightness-110 mx-8"
              />
            </div>
            <div className="inline-flex items-center bg-amber-100 bg-opacity-20 backdrop-blur-sm text-amber-200 px-4 py-2 rounded-full text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              The Premier Web3 Talent Marketplace
            </div>
          </div>

          {/* Row 1: Quick Links */}
          <div className="mb-8 pb-6 border-b border-amber-400 border-opacity-20">
            <div className="text-center">
              <h3 className="text-lg font-bold text-amber-300 mb-6 flex items-center justify-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                Quick Links
              </h3>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
                {pageLinks.map((page, key) => (
                  <Link
                    className="text-amber-100 hover:text-amber-300 transition-colors duration-300 font-medium text-sm px-3 py-1 rounded-lg hover:bg-amber-100 hover:bg-opacity-10"
                    href={{ pathname: page.url }}
                    key={key}
                  >
                    {page.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Community Links */}
          <div className="mb-8 pb-6 border-b border-amber-400 border-opacity-20">
            <div className="text-center">
              <h3 className="text-lg font-bold text-amber-300 mb-6 flex items-center justify-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                Community
              </h3>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-4">
                {socialLinks.slice(0, 3).map((social, key) => (
                  <Link
                    className="text-amber-100 hover:text-amber-300 transition-colors duration-300 font-medium text-sm flex items-center px-3 py-1 rounded-lg hover:bg-amber-100 hover:bg-opacity-10"
                    href={social.url as any}
                    key={key}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {social.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
                {socialLinks.slice(3).map((social, key) => (
                  <Link
                    className="text-amber-100 hover:text-amber-300 transition-colors duration-300 font-medium text-sm flex items-center px-3 py-1 rounded-lg hover:bg-amber-100 hover:bg-opacity-10"
                    href={social.url as any}
                    key={key + 3}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {social.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Contact */}
          <div className="mb-8 pb-6 border-b border-amber-400 border-opacity-20">
            <div className="text-center">
              <h3 className="text-lg font-bold text-amber-300 mb-6 flex items-center justify-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                Contact
              </h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
                <Link
                  className="text-amber-100 hover:text-amber-300 transition-colors duration-300 font-medium text-sm flex items-center px-4 py-2 rounded-lg hover:bg-amber-100 hover:bg-opacity-10"
                  href={`mailto:${contactDetails.email}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {contactDetails.email}
                </Link>
                <Link
                  className="text-amber-100 hover:text-amber-300 transition-colors duration-300 font-medium text-sm flex items-center px-4 py-2 rounded-lg hover:bg-amber-100 hover:bg-opacity-10"
                  href="https://linktr.ee/goodhive"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Linktree
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 text-sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <div className="text-amber-200 text-sm flex items-center justify-center">
              <span className="text-lg mr-2">🐝</span>
              &copy; {new Date().getFullYear()} GoodHive. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
