"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, UserCheck, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface QueueItem {
  id: string;
  type: "talent" | "company";
  name: string;
  email: string;
  submittedAt: string;
  priority?: "high" | "medium" | "low";
}

interface ApprovalQueueProps {
  limit?: number;
  showViewAll?: boolean;
}

export function ApprovalQueue({ limit = 5, showViewAll = true }: ApprovalQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    talents: 0,
    companies: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch("/api/admin/approval-queue");
        // const data = await response.json();
        
        // Mock data for now
        const mockQueue: QueueItem[] = [
          {
            id: "1",
            type: "talent",
            name: "John Doe",
            email: "john@example.com",
            submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            priority: "high",
          },
          {
            id: "2",
            type: "company",
            name: "Tech Corp",
            email: "contact@techcorp.com",
            submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            priority: "medium",
          },
          {
            id: "3",
            type: "talent",
            name: "Jane Smith",
            email: "jane@example.com",
            submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            priority: "low",
          },
        ];

        setQueue(mockQueue.slice(0, limit));
        setStats({
          talents: mockQueue.filter((item) => item.type === "talent").length,
          companies: mockQueue.filter((item) => item.type === "company").length,
          total: mockQueue.length,
        });
      } catch (error) {
        console.error("Error fetching approval queue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [limit]);

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = {
      hour: 3600,
      minute: 60,
    };

    if (seconds < intervals.minute) return "just now";
    if (seconds < intervals.hour) {
      const mins = Math.floor(seconds / intervals.minute);
      return `${mins}m ago`;
    }
    const hours = Math.floor(seconds / intervals.hour);
    return `${hours}h ago`;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC905]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Approval Queue
          </CardTitle>
          {stats.total > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              {stats.total} pending
            </Badge>
          )}
        </div>
        {stats.total > 0 && (
          <div className="flex gap-4 text-sm text-gray-600 mt-2">
            <span>{stats.talents} talents</span>
            <span>{stats.companies} companies</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {item.type === "talent" ? (
                      <UserCheck className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Building2 className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      {item.priority && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{item.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getTimeAgo(new Date(item.submittedAt))}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="ml-2"
                >
                  <Link
                    href={
                      item.type === "talent"
                        ? `/admin/talent-approval`
                        : `/admin/company-approval`
                    }
                  >
                    Review
                  </Link>
                </Button>
              </div>
            ))}
            {showViewAll && stats.total > limit && (
              <div className="pt-2 border-t">
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/admin/approvals">
                    View All {stats.total} Pending Approvals
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

