"use client";

import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { UserGrowthChart } from "@/app/components/admin/UserGrowthChart";
import { JobTrendsChart } from "@/app/components/admin/JobTrendsChart";
import { ReportGenerator } from "@/app/components/admin/ReportGenerator";
import { StatCard } from "@/app/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/Spinner/Spinner";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  jobTrends: Array<{ date: string; count: number }>;
  approvalRates: Array<{
    type: string;
    approved: number;
    pending: number;
    total: number;
    approvalRate: string;
  }>;
  usersByRole: {
    talents: number;
    mentors: number;
    recruiters: number;
  };
  dailyActivity: Array<{ date: string; type: string; count: number }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) return;

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);

      const response = await fetch(
        `/api/admin/analytics?${params.toString()}`,
        { headers }
      );

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (params: any) => {
    // TODO: Implement report generation
    console.log("Generating report with params:", params);
    // This would call an API endpoint to generate and download the report
  };

  const handleDateRangeChange = () => {
    fetchAnalytics();
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-medium text-gray-900 mb-2">
          Error loading analytics
        </p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const talentApproval = analytics.approvalRates.find((r) => r.type === "talents");
  const companyApproval = analytics.approvalRates.find(
    (r) => r.type === "companies"
  );

  return (
    <AdminPageLayout
      title="Analytics Dashboard"
      subtitle="Platform insights and performance metrics"
    >
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="mt-1"
              />
        </div>
            <Button onClick={handleDateRangeChange} className="gap-2">
              <Calendar className="h-4 w-4" />
              Apply Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({ startDate: "", endDate: "" });
                fetchAnalytics();
              }}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReportGenerator(true)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Generate Report
          </Button>
        </div>
      </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
            title="Total Talents"
            value={analytics.usersByRole.talents.toLocaleString()}
          icon={Users}
            color="blue"
            description="Approved talent users"
        />
        <StatCard
            title="Total Mentors"
            value={analytics.usersByRole.mentors.toLocaleString()}
            icon={Users}
            color="green"
            description="Approved mentor users"
        />
        <StatCard
            title="Total Recruiters"
            value={analytics.usersByRole.recruiters.toLocaleString()}
            icon={Users}
            color="purple"
            description="Approved recruiter users"
          />
          {talentApproval && (
        <StatCard
              title="Talent Approval Rate"
              value={`${talentApproval.approvalRate}%`}
              icon={CheckCircle2}
              color="green"
              description={`${talentApproval.approved} approved, ${talentApproval.pending} pending`}
        />
          )}
      </div>

        {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserGrowthChart data={analytics.userGrowth} loading={loading} />
          <JobTrendsChart data={analytics.jobTrends} loading={loading} />
        </div>

        {/* Approval Rates */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Approval Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {talentApproval && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Talents</span>
                  <Badge variant="outline">{talentApproval.approvalRate}%</Badge>
          </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                    className="bg-green-500 h-2 rounded-full"
                        style={{
                      width: `${talentApproval.approvalRate}%`,
                        }}
                  />
                      </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{talentApproval.approved} approved</span>
                  <span>{talentApproval.pending} pending</span>
                  </div>
              </div>
            )}
            {companyApproval && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Companies</span>
                  <Badge variant="outline">{companyApproval.approvalRate}%</Badge>
          </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                    className="bg-blue-500 h-2 rounded-full"
                        style={{
                      width: `${companyApproval.approvalRate}%`,
                        }}
                  />
                      </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{companyApproval.approved} approved</span>
                  <span>{companyApproval.pending} pending</span>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportGenerator
        open={showReportGenerator}
        onOpenChange={setShowReportGenerator}
        onGenerate={handleGenerateReport}
      />
    </AdminPageLayout>
  );
}
