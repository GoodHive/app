"use client";

import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Building2,
  FileText,
  Users,
  TrendingUp,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Approve Talents",
    href: "/admin/talent-approval",
    icon: <UserCheck className="h-5 w-5" />,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    label: "Approve Companies",
    href: "/admin/company-approval",
    icon: <Building2 className="h-5 w-5" />,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    label: "View All Jobs",
    href: "/admin/all-jobs",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "bg-yellow-500 hover:bg-yellow-600",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    color: "bg-gray-500 hover:bg-gray-600",
  },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant="outline"
              className={`w-full justify-start gap-2 ${action.color} text-white border-0`}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}


