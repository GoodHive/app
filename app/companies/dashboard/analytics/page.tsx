"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Globe,
  Clock,
  Zap,
  Target,
  Layers
} from "lucide-react";
import { Loader } from "@components/loader";

interface AnalyticsData {
  overview: {
    totalJobs: number;
    publishedJobs: number;
    draftJobs: number;
    fundedJobs: number;
    totalFunded: string;
    averageBudget: string;
  };
  statusDistribution: {
    draft: number;
    published: number;
    funded: number;
  };
  chainDistribution: Record<string, number>;
  durationDistribution: Record<string, number>;
  jobTypeDistribution: Record<string, number>;
  engagementDistribution: Record<string, number>;
  insights: {
    mostUsedSkills: { skill: string; count: number }[];
    totalBudget: number;
    skillsCount: number;
    averageJobsPerMonth: string;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = Cookies.get("user_id");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/companies/dashboard-stats?userId=${userId}`);
        if (response.ok) {
          const analytics = await response.json();
          setData(analytics);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load analytics data.</p>
      </div>
    );
  }

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
            <p className="text-yellow-100">
              Real-time insights from your {data.overview.totalJobs} job postings
            </p>
          </div>
          <BarChart3 className="h-12 w-12 opacity-80" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Briefcase className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${typeof data.insights.totalBudget === 'number' ?
                  data.insights.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 }) :
                  '0'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Avg: ${parseFloat(data.overview.averageBudget).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-green-50">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Publication Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{getPercentage(data.overview.publishedJobs, data.overview.totalJobs)}%</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {data.overview.publishedJobs} of {data.overview.totalJobs} published
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-purple-50">
              <Zap className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unique Skills</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.insights.skillsCount}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Skills across all jobs
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Clock className="w-7 h-7 text-yellow-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Avg/Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.insights.averageJobsPerMonth}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Jobs posted per month
          </div>
        </div>
      </div>

      {/* Job Characteristics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Blockchain Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-green-600" />
            Blockchain Networks
          </h3>
          <div className="space-y-3">
            {Object.entries(data.chainDistribution).map(([chain, count]) => (
              <div key={chain} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {chain.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{count}</span>
                  <span className="text-xs text-gray-400">
                    ({getPercentage(count, data.overview.totalJobs)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            Project Duration
          </h3>
          <div className="space-y-3">
            {Object.entries(data.durationDistribution).map(([duration, count]) => (
              <div key={duration} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {duration.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{count}</span>
                  <span className="text-xs text-gray-400">
                    ({getPercentage(count, data.overview.totalJobs)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Types */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" />
            Engagement Types
          </h3>
          <div className="space-y-3">
            {Object.entries(data.engagementDistribution).map(([engagement, count]) => (
              <div key={engagement} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {engagement}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{count}</span>
                  <span className="text-xs text-gray-400">
                    ({getPercentage(count, data.overview.totalJobs)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Status & Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Status Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Job Status Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Published</span>
                <span className="text-sm text-gray-500">{data.statusDistribution.published + data.statusDistribution.funded}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(data.statusDistribution.published + data.statusDistribution.funded, data.overview.totalJobs)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Draft</span>
                <span className="text-sm text-gray-500">{data.statusDistribution.draft}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(data.statusDistribution.draft, data.overview.totalJobs)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Funded</span>
                <span className="text-sm text-gray-500">{data.statusDistribution.funded}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(data.statusDistribution.funded, data.overview.totalJobs)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Skills */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-purple-600" />
            Most Requested Skills
          </h3>
          <div className="space-y-3">
            {data.insights.mostUsedSkills.slice(0, 8).map((skill, index) => (
              <div key={skill.skill} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-purple-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(skill.count / Math.max(...data.insights.mostUsedSkills.map(s => s.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-6">{skill.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-gray-600" />
          Summary Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-medium text-blue-900">Publication Success</p>
            <p className="text-blue-700">
              {getPercentage(data.overview.publishedJobs, data.overview.totalJobs)}% of jobs are published on blockchain
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="font-medium text-purple-900">Skills Diversity</p>
            <p className="text-purple-700">
              {data.insights.skillsCount} unique skills across {data.overview.totalJobs} jobs
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="font-medium text-green-900">Average Budget</p>
            <p className="text-green-700">
              ${parseFloat(data.overview.averageBudget).toLocaleString(undefined, { maximumFractionDigits: 0 })} per job on average
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="font-medium text-yellow-900">Activity Level</p>
            <p className="text-yellow-700">
              {data.insights.averageJobsPerMonth} jobs posted per month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}