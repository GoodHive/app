"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Building2,
  UserCheck,
  Network,
  LogOut,
  Settings,
  HelpCircle,
  Bell,
  Home,
  CreditCard,
  BarChart3,
} from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  children?: React.ReactNode;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  dataE2e?: string;
}

const personalNavItems: NavItem[] = [
  {
    href: "/admin",
    icon: <Home className={styles.navIcon} />,
    label: "Dashboard",
    dataE2e: "admin-dashboard-menu",
  },
  {
    href: "/admin/talent-approval",
    icon: <UserCheck className={styles.navIcon} />,
    label: "Approve Talents",
    dataE2e: "talent-approval-menu",
  },
  {
    href: "/admin/company-approval",
    icon: <Building2 className={styles.navIcon} />,
    label: "Approve Companies",
    dataE2e: "company-approval-menu",
  },
  {
    href: "/admin/all-jobs",
    icon: <Users className={styles.navIcon} />,
    label: "All Jobs",
    dataE2e: "all-jobs-menu",
  },
  {
    href: "/admin/talents",
    icon: <Network className={styles.navIcon} />,
    label: "All Talents",
    dataE2e: "talents-menu",
  },
  {
    href: "/admin/companies",
    icon: <Building2 className={styles.navIcon} />,
    label: "All Companies",
    dataE2e: "companies-menu",
  },
  {
    href: "/admin/users",
    icon: <Users className={styles.navIcon} />,
    label: "All Users",
    dataE2e: "users-menu",
  },
  {
    href: "/admin/admins",
    icon: <Users className={styles.navIcon} />,
    label: "Manage Admins",
    dataE2e: "admins-menu",
  },
  {
    href: "/admin/analytics",
    icon: <BarChart3 className={styles.navIcon} />,
    label: "Analytics",
    dataE2e: "analytics-menu",
  },
];

const bottomNavItems: NavItem[] = [
  {
    href: "/admin/settings",
    icon: <Settings className={styles.navIcon} />,
    label: "Settings",
    dataE2e: "settings-menu",
  },
  {
    href: "/admin/support",
    icon: <HelpCircle className={styles.navIcon} />,
    label: "Support",
    dataE2e: "support-menu",
  },
];

const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  // If we're on the login page, don't apply the admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    Cookies.remove("admin_token");
    toast.success("Logged out successfully");
    router.push("/admin/login");
  };

  const isActiveLink = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          {/* Header */}
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Admin Dashboard</h2>
          </div>

          {/* Navigation Section */}
          <div className={styles.navigationSection}>
            <div className={styles.sectionLabel}>
              <p>Navigation</p>
            </div>

            {/* Nav Items */}
            <nav className={styles.navList}>
              {personalNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as any}
                  data-e2e={item.dataE2e}
                  className={`${styles.navItem} ${
                    isActiveLink(item.href) ? styles.navItemActive : ""
                  }`}
                >
                  {item.icon}
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <nav className={styles.bottomNav}>
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                data-e2e={item.dataE2e}
                className={styles.navItem}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className={`${styles.navItem} ${styles.logoutButton}`}
            >
              <LogOut className={styles.navIcon} />
              <span className={styles.navLabel}>Logout</span>
            </button>
          </nav>

          {/* Brand Footer */}
          <div className={styles.brandFooter}>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>GoodHive</span>
              <span className={styles.brandBadge}>ADMIN</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
};

export default Sidebar;
