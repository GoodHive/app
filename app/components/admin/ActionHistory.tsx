"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import moment from "moment";

interface ActionHistoryItem {
  id: string;
  action: string;
  actor: string;
  target_type: "talent" | "company" | "job" | "user";
  target_id: string;
  target_name: string;
  timestamp: string;
  details?: string;
  status: "success" | "failed" | "pending";
}

interface ActionHistoryProps {
  targetType: "talent" | "company" | "job";
  targetId: string;
  limit?: number;
}

export function ActionHistory({
  targetType,
  targetId,
  limit = 10,
}: ActionHistoryProps) {
  const [history, setHistory] = useState<ActionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActionHistory();
  }, [targetType, targetId]);

  const fetchActionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/action-history?targetType=${targetType}&targetId=${targetId}&limit=${limit}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching action history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("approve")) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (action.includes("reject")) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (action.includes("edit") || action.includes("update")) {
      return <Edit className="h-4 w-4 text-blue-600" />;
    }
    if (action.includes("delete")) {
      return <Trash2 className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500 text-white">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC905]"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No action history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Action History
      </h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getActionIcon(item.action)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.action}
                </p>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="h-3 w-3" />
                <span>{item.actor}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{moment(item.timestamp).fromNow()}</span>
              </div>
              {item.details && (
                <p className="text-xs text-gray-600 mt-1">{item.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
