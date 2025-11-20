"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  Edit3,
  DollarSign,
  Users,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase
} from "lucide-react";
import { Loader } from "@components/loader";
import JobBalance from "@/app/components/JobBalance";
import FundManager from "@/app/components/FundManager";

interface Job {
  id: string;
  title: string;
  companyName: string;
  typeEngagement: string;
  description: string;
  duration: string;
  budget: number;
  projectType: string;
  skills: string[];
  country: string;
  city: string;
  chain: string;
  jobType: string;
  image_url: string;
  walletAddress: string;
  escrowAmount: number;
  currency?: string;
  mentor: boolean;
  recruiter: boolean;
  talent: boolean;
  postedAt: string;
  block_id?: string;
}

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showFundManager, setShowFundManager] = useState(false);
  const [selectedJobForFunding, setSelectedJobForFunding] = useState<Job | null>(null);
  const userId = Cookies.get("user_id");

  useEffect(() => {
    const fetchJobs = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/companies/jobs?userId=${userId}`);
        if (response.ok) {
          const jobsData = await response.json();
          setJobs(jobsData);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [userId]);

  const refreshJobs = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/companies/jobs?userId=${userId}`);
      if (response.ok) {
        const jobsData = await response.json();
        setJobs(jobsData);
      }
    } catch (error) {
      console.error("Error refreshing jobs:", error);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "published" && job.block_id) ||
      (filterStatus === "draft" && !job.block_id) ||
      (filterStatus === "funded" && job.escrowAmount > 0);

    return matchesSearch && matchesFilter;
  });

  const getJobStatus = (job: Job) => {
    if (!job.block_id) return { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock };
    if (job.escrowAmount > 0) return { label: "Funded", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
    return { label: "Published", color: "bg-blue-100 text-blue-800", icon: AlertCircle };
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id));
    }
  };

  const openFundManager = (job: Job) => {
    setSelectedJobForFunding(job);
    setShowFundManager(true);
  };

  const closeFundManager = () => {
    setShowFundManager(false);
    setSelectedJobForFunding(null);
    refreshJobs(); // Refresh jobs after funding operations
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
          <p className="text-gray-600">Manage all your job postings in one place</p>
        </div>
        <Link
          href="/companies/create-job"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Job
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs by title or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="funded">Funded</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 ${viewMode === "grid" ? "bg-yellow-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 ${viewMode === "list" ? "bg-yellow-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedJobs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-800">
              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600">
                Bulk Edit
              </button>
              <button className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600">
                Bulk Fund
              </button>
              <button
                onClick={() => setSelectedJobs([])}
                className="px-3 py-1 border border-yellow-500 text-yellow-700 text-sm font-medium rounded hover:bg-yellow-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Grid/List */}
      {filteredJobs.length > 0 ? (
        <>
          {/* Select All */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
            />
            <label htmlFor="select-all" className="text-sm text-gray-600">
              Select all ({filteredJobs.length} jobs)
            </label>
          </div>

          {viewMode === "grid" ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job) => {
                const status = getJobStatus(job);
                const StatusIcon = status.icon;
                const isSelected = selectedJobs.includes(job.id);

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 ${
                      isSelected ? "border-yellow-500 ring-2 ring-yellow-200 transform scale-105" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectJob(job.id)}
                          className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {status.label}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                        {job.title}
                      </h3>

                      <div className="flex items-center space-x-3 text-sm text-gray-600 mb-4">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {job.chain}
                        </span>
                        <span>{job.projectType}</span>
                        <span>{job.duration?.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      {/* Budget and Balance Row */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Budget</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">${job.budget.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Balance</p>
                          <div className="text-xl font-bold text-green-600 mt-1">
                            {job.block_id ? (
                              <JobBalance
                                jobId={job.block_id}
                                currency={job.currency || "USDC"}
                                className="text-xl font-bold"
                                showLabel={false}
                                showCurrency={true}
                              />
                            ) : (
                              <span className="text-gray-400">No funds</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 4).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="text-xs text-gray-500 self-center">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-6">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-purple-500" />
                          <span>0 applications</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1 text-blue-500" />
                          <span>0 views</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-6 pb-6">
                      <div className="flex space-x-3">
                        <Link
                          href={`/companies/create-job?id=${job.id}`}
                          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-center"
                        >
                          <Edit3 className="w-4 h-4 inline mr-2" />
                          Edit
                        </Link>
                        {job.block_id && (
                          <button
                            onClick={() => openFundManager(job)}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all shadow-md"
                          >
                            <DollarSign className="w-4 h-4 inline mr-2" />
                            Fund
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const status = getJobStatus(job);
                const StatusIcon = status.icon;
                const isSelected = selectedJobs.includes(job.id);

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-lg border p-6 transition-all hover:shadow-md ${
                      isSelected ? "border-yellow-500 ring-2 ring-yellow-200" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectJob(job.id)}
                          className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {job.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.label}
                                </span>
                                <span>${job.budget.toLocaleString()}</span>
                                <span>{job.chain}</span>
                                {job.block_id && (
                                  <JobBalance
                                    jobId={job.block_id}
                                    currency={job.currency || "USDC"}
                                    className="text-sm font-medium text-green-600"
                                    showLabel={false}
                                    showCurrency={true}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Link
                                href={`/companies/create-job?id=${job.id}`}
                                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                              >
                                <Edit3 className="w-4 h-4 inline mr-1" />
                                Edit
                              </Link>
                              {job.block_id && (
                                <button
                                  onClick={() => openFundManager(job)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-medium rounded-md hover:from-yellow-500 hover:to-orange-600"
                                >
                                  <DollarSign className="w-4 h-4 inline mr-1" />
                                  Fund
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first job posting"
            }
          </p>
          <Link
            href="/companies/create-job"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Link>
        </div>
      )}

      {/* Fund Manager Modal */}
      {showFundManager && selectedJobForFunding && (
        <FundManager
          jobId={selectedJobForFunding.block_id || selectedJobForFunding.id}
          databaseJobId={selectedJobForFunding.id}
          tokenAddress="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" // USDC on Polygon
          jobChainId={137} // Polygon
          jobChainLabel="Polygon"
          onClose={closeFundManager}
        />
      )}
    </div>
  );
}