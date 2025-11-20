"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  Eye,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight
} from "lucide-react";
import { Loader } from "@components/loader";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalFunded: string;
  totalApplications: number;
  recentJobs: any[];
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = Cookies.get("user_id");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/companies/jobs?userId=${userId}`);

        if (response.ok) {
          const jobs = await response.json();

          // Calculate stats from jobs data
          const totalJobs = jobs.length;
          const activeJobs = jobs.filter((job: any) => job.block_id).length;
          const totalFunded = jobs.reduce((sum: number, job: any) => sum + (parseFloat(job.escrowAmount) || 0), 0);
          const recentJobs = jobs.slice(0, 5); // Get 5 most recent jobs

          setStats({
            totalJobs,
            activeJobs,
            totalFunded: totalFunded.toFixed(2),
            totalApplications: 0, // TODO: Add applications count when API is available
            recentJobs
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      icon: TrendingUp,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Total Funded",
      value: `$${stats?.totalFunded || "0.00"}`,
      icon: DollarSign,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700"
    },
    {
      title: "Applications",
      value: stats?.totalApplications || 0,
      icon: Users,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to your Dashboard!</h2>
        <p className="text-yellow-100 mb-4">
          Manage your jobs, track performance, and grow your business with Web3 talent.
        </p>
        <div className="flex space-x-4">
          <Link
            href="/companies/create-job"
            className="inline-flex items-center px-4 py-2 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Link>
          <Link
            href="/companies/dashboard/jobs"
            className="inline-flex items-center px-4 py-2 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-yellow-600 transition-colors"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Manage Jobs
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid grid grid-cols-1 gap-4 lg:gap-6">
        <style jsx>{`
          @media (min-width: 640px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (min-width: 863px) {
            .stats-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
        `}</style>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${stat.bgColor} ring-4 ring-opacity-20 ${stat.bgColor.replace('bg-', 'ring-')}`}>
                  <Icon className={`w-7 h-7 ${stat.textColor}`} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-2xl xl:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full ${stat.color} mr-2`}></div>
                  <span className="text-xs">Updated now</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/companies/create-job"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Plus className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Create New Job</p>
                <p className="text-sm text-gray-600">Post a new position and find talent</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              href="/companies/dashboard/jobs"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Manage Jobs</p>
                <p className="text-sm text-gray-600">Edit, fund, and track your jobs</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link
              href="/companies/my-profile"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-600">Keep your company info current</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
            <Link
              href="/companies/dashboard/jobs"
              className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              View All
            </Link>
          </div>

          {stats?.recentJobs && stats.recentJobs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentJobs.slice(0, 4).map((job) => (
                <div key={job.id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{job.title}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">${job.budget}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        job.block_id
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.block_id ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/companies/create-job?id=${job.id}`}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">No jobs created yet</p>
              <Link
                href="/companies/create-job"
                className="inline-flex items-center mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-700"
              >
                Create your first job
                <ArrowRight className="ml-1 w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="p-3 bg-yellow-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Plus className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Create Your First Job</h4>
            <p className="text-sm text-gray-600">Post a detailed job description to attract the best Web3 talent.</p>
          </div>

          <div className="text-center p-4">
            <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Fund Your Jobs</h4>
            <p className="text-sm text-gray-600">Add crypto funds to show commitment and attract quality applicants.</p>
          </div>

          <div className="text-center p-4">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Eye className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Track Performance</h4>
            <p className="text-sm text-gray-600">Monitor applications, views, and optimize your job postings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}