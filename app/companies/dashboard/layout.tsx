"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  User,
  Settings,
  Wallet,
  Menu,
  X,
  BarChart3
} from "lucide-react";
import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  {
    href: "/companies/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true
  },
  {
    href: "/companies/dashboard/jobs",
    label: "My Jobs",
    icon: Briefcase,
    exact: false
  },
  {
    href: "/companies/create-job",
    label: "Create Job",
    icon: Plus,
    exact: false
  },
  {
    href: "/companies/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    exact: false
  },
  {
    href: "/companies/my-profile",
    label: "Company Profile",
    icon: User,
    exact: false
  },
  {
    href: "/companies/dashboard/settings",
    label: "Settings",
    icon: Settings,
    exact: false
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActiveRoute = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthLayout>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GH</span>
                </div>
                <span className="text-lg font-semibold text-gray-800">Dashboard</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href, item.exact);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Quick Actions</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Manage funds, view analytics, and track job performance all in one place.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Top Navigation Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">
                    {pathname === '/companies/dashboard' && 'Dashboard Overview'}
                    {pathname === '/companies/dashboard/jobs' && 'Job Management'}
                    {pathname === '/companies/dashboard/analytics' && 'Analytics & Insights'}
                    {pathname === '/companies/dashboard/settings' && 'Settings'}
                    {pathname === '/companies/create-job' && 'Create New Job'}
                    {pathname === '/companies/my-profile' && 'Company Profile'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Manage your jobs and grow your business
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/companies/create-job"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-4 py-6 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}