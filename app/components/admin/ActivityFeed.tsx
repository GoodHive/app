"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Briefcase } from "lucide-react";
import Link from "next/link";

interface Activity {
  type: "talent" | "company";
  name: string;
  id: string;
  timestamp: string;
  status: "approved" | "pending";
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "talent":
        return <User className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getLink = (type: string, id: string) => {
    switch (type) {
      case "talent":
        return `/admin/talent/${id}`;
      case "company":
        return `/admin/company/${id}`;
      default:
        return "#";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent activity
          </p>
        ) : (
          activities.map((activity, index) => (
            <Link
              key={`${activity.type}-${activity.id}-${index}`}
              href={getLink(activity.type, activity.id)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="bg-[#FFC905]/10 rounded-full p-2">
                  {getIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.name}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.type === "talent" ? "Talent" : "Company"} •{" "}
                  {formatTime(activity.timestamp)}
                </p>
              </div>
              <Badge
                className={
                  activity.status === "approved"
                    ? "bg-green-500 text-white"
                    : "bg-orange-500 text-white"
                }
              >
                {activity.status}
              </Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}


