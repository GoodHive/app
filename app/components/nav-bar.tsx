"use client";

import { googleLogout } from "@react-oauth/google";
import Cookies from "js-cookie";
import { CircleUserRound, LogOut } from "lucide-react";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";
import { FEATURES } from "@/lib/thirdweb/config";

// Dynamic import to avoid SSR issues
const SimpleConnectButton = React.lazy(() => 
  import("./ThirdwebConnect/SimpleConnectButton").then(mod => ({ 
    default: mod.SimpleConnectButton 
  }))
);

const commonLinks = [
  { href: "/talents/job-search", label: "Find a Job" },
  { href: "/companies/search-talents", label: "Find a Talent" },
];

const talentsLinks = [
  { href: "/talents/job-search", label: "Job Search" },
  { href: "/talents/my-profile", label: "My Talent Profile" },
];

const companiesLinks = [
  { href: "/companies/search-talents", label: "Search Talents" },
  { href: "/companies/my-profile", label: "My Company Profile" },
];

export const NavBar = () => {
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isOpenUserMenu, setIsOpenUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Thirdweb account
  const account = useActiveAccount();
  const loggedInUserId = Cookies.get("user_id");
  const userEmail = Cookies.get("user_email");

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsOpenUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Clear cookies
      Cookies.remove("user_id");
      Cookies.remove("user_email");
      Cookies.remove("user_address");
      Cookies.remove("smart_account");
      Cookies.remove("session_token");
      
      // Clear localStorage
      localStorage.clear();
      
      // Google logout
      googleLogout();
      
      toast.success("🐝 Logged out successfully");
      
      // Redirect to home
      router.push("/");
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out. Please refresh the page.");
    }
  };

  // Get navigation links based on current path
  const getNavLinks = () => {
    if (pathname.startsWith("/talents")) return talentsLinks;
    if (pathname.startsWith("/companies")) return companiesLinks;
    return commonLinks;
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/img/goodhive_light_logo.png"
                alt="GoodHive"
                width={150}
                height={40}
                priority
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-yellow-600 bg-yellow-50"
                    : "text-gray-700 hover:text-yellow-600 hover:bg-yellow-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side - Auth */}
          <div className="flex items-center space-x-4">
            {loggedInUserId ? (
              // Logged in state
              <div className="flex items-center space-x-3">
                {/* Thirdweb Wallet Connect - Simplified */}
                {FEATURES.USE_THIRDWEB && (
                  <React.Suspense fallback={<div className="w-32 h-10 bg-gray-200 animate-pulse rounded" />}>
                    <SimpleConnectButton
                      label="🐝 Wallet"
                    />
                  </React.Suspense>
                )}
                
                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                  >
                    <CircleUserRound size={20} />
                    <span className="hidden sm:block">
                      {userEmail ? userEmail.split('@')[0] : 'Profile'}
                    </span>
                  </button>

                  {/* User Dropdown */}
                  {isOpenUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link
                        href="/talents/my-profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
                        onClick={() => setIsOpenUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/user-profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600"
                        onClick={() => setIsOpenUserMenu(false)}
                      >
                        Account Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Not logged in state
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors"
                >
                  🐝 Connect to Hive
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpenMobileMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "text-yellow-600 bg-yellow-50"
                    : "text-gray-700 hover:text-yellow-600 hover:bg-yellow-50"
                }`}
                onClick={() => setIsOpenMobileMenu(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile auth section */}
            {loggedInUserId && (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/talents/my-profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-yellow-50"
                  onClick={() => setIsOpenMobileMenu(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setIsOpenMobileMenu(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};