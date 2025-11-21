"use client";

import { FC, ReactNode } from "react";
import { Route } from "next";
import { Building2, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof User;
  authDescription: string;
}

interface ProfileDropdownProps {
  isAuthenticated: boolean;
  trigger: ReactNode;
}

const menuItems: MenuItem[] = [
  {
    label: "Talent Profile",
    href: "/talents/my-profile",
    icon: User,
    authDescription: "access your talent profile",
  },
  {
    label: "Company Profile",
    href: "/companies/my-profile",
    icon: Building2,
    authDescription: "access your company profile",
  },
  {
    label: "User Profile",
    href: "/user-profile",
    icon: Settings,
    authDescription: "access your profile",
  },
];

export const ProfileDropdown: FC<ProfileDropdownProps> = ({
  isAuthenticated,
  trigger,
}) => {
  const { navigate: protectedNavigate } = useProtectedNavigation();

  const handleNavigation = (href: string, authDescription: string) => {
    protectedNavigate(href as Route, authDescription);
  };

  // Don't render dropdown if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="group focus:outline-none">
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={16}
        className="w-64 sm:w-72 md:w-80 mt-2 bg-gradient-to-br from-amber-50 via-white to-yellow-50/80 backdrop-blur-xl border border-amber-200/60 shadow-2xl rounded-2xl p-2 z-50 animate-in slide-in-from-top-2 fade-in-0 duration-200"
        avoidCollisions={false}
        style={{
          boxShadow: "0 20px 40px -12px rgba(245, 158, 11, 0.4), 0 8px 16px -8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <DropdownMenuItem
              key={item.href}
              onClick={() => handleNavigation(item.href, item.authDescription)}
              className="group flex items-center w-full px-4 py-3.5 text-gray-700 hover:text-amber-900 bg-transparent hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100/70 rounded-xl transition-all duration-300 cursor-pointer focus:bg-gradient-to-r focus:from-amber-100 focus:to-yellow-100/70 focus:text-amber-900 focus:outline-none border-0 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg mr-4 group-hover:from-amber-200 group-hover:to-yellow-200 transition-all duration-300 group-hover:shadow-md">
                <item.icon className="w-5 h-5 text-amber-600 group-hover:text-amber-700 transition-colors duration-300" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-sm sm:text-base tracking-tight">
                  {item.label}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        {/* Subtle bottom decoration */}
        <div className="mt-3 pt-2 border-t border-amber-200/50">
          <div className="flex justify-center">
            <div className="w-8 h-1 bg-gradient-to-r from-amber-300 to-yellow-300 rounded-full opacity-50"></div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};