"use client";

import { useEffect, useState } from "react";
import { Clock, User, Building2, FileText, CheckCircle, XCircle } from "lucide-react";
// Using native Date methods instead of date-fns

interface ActivityItem {
  id: string;
  type: "user" | "company" | "job" | "approval";
  action: string;
  description: string;
  timestamp: string;
  status?: "success" | "pending" | "rejected";
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  if (seconds < 60) return "just now";
  if (seconds < intervals.hour) {
    const mins = Math.floor(seconds / intervals.minute);
    return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  }
  if (seconds < intervals.day) {
    const hours = Math.floor(seconds / intervals.hour);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  if (seconds < intervals.week) {
    const days = Math.floor(seconds / intervals.day);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
  if (seconds < intervals.month) {
    const weeks = Math.floor(seconds / intervals.week);
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }
  if (seconds < intervals.year) {
    const months = Math.floor(seconds / intervals.month);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(seconds / intervals.year);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent activities from API
    // For now, using mock data - Agent 1 should implement API endpoint
    const fetchActivities = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch("/api/admin/activities");
        // const data = await response.json();
        
        // Mock data for now
        setActivities([
          {
            id: "1",
            type: "user",
            action: "New user registered",
            description: "New talent profile created",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            status: "success",
          },
          {
            id: "2",
            type: "company",
            action: "Company approved",
            description: "Company profile approved",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            status: "success",
          },
          {
            id: "3",
            type: "job",
            action: "New job posted",
            description: "New job listing created",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: "pending",
          },
        ]);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      case "job":
        return <FileText className="h-4 w-4" />;
      case "approval":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status?: ActivityItem["status"]) => {
    if (!status) return null;
    return status === "success" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : status === "rejected" ? (
      <XCircle className="h-4 w-4 text-red-500" />
    ) : null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC905]"></div>
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No recent activity
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  {getStatusIcon(activity.status)}
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400">
                  {getTimeAgo(new Date(activity.timestamp))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

