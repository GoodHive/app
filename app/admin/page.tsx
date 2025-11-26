"use client";

import Spinner from "@/app/components/Spinner/Spinner";
import { StatCard } from "@/app/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Statistics {
  overview: {
    totalUsers: number;
    totalTalents: number;
    totalCompanies: number;
    totalJobs: number;
    totalAdmins: number;
  };
  approvals: {
    pendingTalents: number;
    pendingCompanies: number;
    approvedTalents: number;
    approvedCompanies: number;
  };
  jobs: {
    total: number;
    published: number;
    unpublished: number;
  };
  recent: {
    usersLast7Days: number;
    jobsLast7Days: number;
  };
  profiles: {
    usersWithTalentProfiles: number;
    usersWithoutProfiles: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const getAuthHeaders = () => {
    const token = Cookies.get("admin_token");
    if (!token) {
      router.push("/admin/login");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch("/api/admin/statistics", { headers });
      
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {error || "Failed to load dashboard"}
        </p>
        <Button onClick={fetchStatistics} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const totalPending = statistics.approvals.pendingTalents + statistics.approvals.pendingCompanies;

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your GoodHive platform
          </p>
        </div>
        <Button onClick={fetchStatistics} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={statistics.overview.totalUsers.toLocaleString()}
          icon={Users}
          trend={{
            value: statistics.recent.usersLast7Days,
            isPositive: true,
          }}
          description="new in last 7 days"
        />
        <StatCard
          title="Total Talents"
          value={statistics.overview.totalTalents.toLocaleString()}
          icon={UserCheck}
          trend={{
            value: statistics.approvals.approvedTalents,
            isPositive: true,
          }}
          description="approved"
        />
        <StatCard
          title="Total Companies"
          value={statistics.overview.totalCompanies.toLocaleString()}
          icon={Building2}
          trend={{
            value: statistics.approvals.approvedCompanies,
            isPositive: true,
          }}
          description="approved"
        />
        <StatCard
          title="Total Jobs"
          value={statistics.overview.totalJobs.toLocaleString()}
          icon={Briefcase}
          trend={{
            value: statistics.recent.jobsLast7Days,
            isPositive: true,
          }}
          description="new in last 7 days"
        />
      </div>

      {/* Secondary Stats and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Approvals
            </h3>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  Talents
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {statistics.approvals.pendingTalents}
                </span>
                <Link href="/admin/talent-approval">
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  Companies
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {statistics.approvals.pendingCompanies}
                </span>
                <Link href="/admin/company-approval">
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </Link>
              </div>
            </div>
            {totalPending > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/admin/talent-approval">
                  <Button className="w-full" variant="default">
                    View All Pending ({totalPending})
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Jobs Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Jobs Status</h3>
            <Briefcase className="h-5 w-5 text-[#FFC905]" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className="text-2xl font-bold text-green-600">
                {statistics.jobs.published}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Unpublished</span>
              <span className="text-2xl font-bold text-gray-600">
                {statistics.jobs.unpublished}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/admin/all-jobs">
                <Button variant="outline" className="w-full" size="sm">
                  View All Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Profile Statistics
            </h3>
            <TrendingUp className="h-5 w-5 text-[#FFC905]" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">With Talent Profiles</span>
              <span className="text-lg font-semibold text-gray-900">
                {statistics.profiles.usersWithTalentProfiles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Without Profiles</span>
              <span className="text-lg font-semibold text-gray-900">
                {statistics.profiles.usersWithoutProfiles}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full" size="sm">
                  View All Users
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/talent-approval">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <UserCheck className="h-5 w-5" />
                <span className="text-sm">Approve Talents</span>
              </Button>
            </Link>
            <Link href="/admin/company-approval">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="text-sm">Approve Companies</span>
              </Button>
            </Link>
            <Link href="/admin/talents">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">All Talents</span>
              </Button>
            </Link>
            <Link href="/admin/companies">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="text-sm">All Companies</span>
              </Button>
            </Link>
            <Link href="/admin/all-jobs">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span className="text-sm">All Jobs</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">All Users</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Total Admins
                </span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {statistics.overview.totalAdmins}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Approved Talents
                </span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {statistics.approvals.approvedTalents}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Approved Companies
                </span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {statistics.approvals.approvedCompanies}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
