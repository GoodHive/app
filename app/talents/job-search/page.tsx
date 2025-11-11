import { Pagination } from "@/app/components/pagination";
import { fetchJobs } from "@/lib/jobsearch";
import { Metadata } from "next";
import JobResult from "./job-result";
import {
  ArrowDownUp,
  Briefcase,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle,
  FolderOpen,
  GraduationCap,
  MapPin,
  Search,
  User,
  UserCheck,
  Wallet,
  Wrench,
  Building,
} from "lucide-react";

const DATE_POSTED_LABELS: Record<string, string> = {
  "1d": "Past 24 hours",
  "3d": "Past 3 days",
  "7d": "Past week",
  "14d": "Past 2 weeks",
  "30d": "Past month",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  freelance: "Freelancing",
  remote: "Employee",
  any: "Any engagement",
};

const SORT_LABELS: Record<string, string> = {
  latest: "Latest",
  oldest: "Oldest",
  budget_high: "Budget high to low",
  budget_low: "Budget low to high",
};

const formatBudgetRange = (range?: string) => {
  if (!range) {
    return "";
  }

  const [minRaw, maxRaw] = range.split("-");
  if (!minRaw) {
    return "";
  }

  const formatValue = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }
    return `$${numeric.toLocaleString()}`;
  };

  if (maxRaw) {
    return `${formatValue(minRaw)} – ${formatValue(maxRaw)}`;
  }

  return `${formatValue(minRaw)}+`;
};

export const metadata: Metadata = {
  title: "Job Search - Find Web3 & Blockchain Opportunities | GoodHive",
  description:
    "Search and discover the latest Web3 jobs, blockchain opportunities, and crypto positions. Find your next role in the decentralized economy with our comprehensive job search platform.",
  keywords:
    "Web3 jobs, blockchain jobs, crypto jobs, decentralized jobs, tech recruitment, remote jobs, freelance opportunities",
};

const itemsPerPage = 10;

export const revalidate = 0;

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    location?: string;
    name?: string;
    page: number;
    recruiter?: string;
    openToRecruiter?: string;
    mentor?: string;
    // New "Open to" filters
    openToTalents?: string;
    jobType?: string;
    engagement?: string;
    datePosted?: string;
    budgetRange?: string;
    sort?: string;
  };
}) {
  console.log("Search params received:", searchParams);

  const query = { items: itemsPerPage, ...searchParams };
  const { jobs, count } = (await fetchJobs(query)) || {
    jobs: [],
    count: 0,
  };

  console.log("Jobs found:", jobs.length);
  console.log("Total count:", count);
  console.log("First job:", jobs[0]);

  const openToRecruiterFilter =
    searchParams.openToRecruiter ?? searchParams.recruiter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      {/* Honeycomb Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Floating Hexagon Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-8 h-8 rotate-12 opacity-20">
          <div className="w-full h-full bg-amber-400 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute top-40 right-20 w-6 h-6 rotate-45 opacity-15">
          <div className="w-full h-full bg-yellow-500 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute bottom-32 left-1/4 w-10 h-10 rotate-12 opacity-10">
          <div className="w-full h-full bg-orange-400 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute top-1/3 right-10 w-4 h-4 rotate-90 opacity-25">
          <div className="w-full h-full bg-amber-300 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute top-60 left-20 w-5 h-5 rotate-30 opacity-15">
          <div className="w-full h-full bg-yellow-400 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute bottom-20 right-1/3 w-7 h-7 rotate-60 opacity-20">
          <div className="w-full h-full bg-amber-500 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl mb-6 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Job Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover the latest Web3 and blockchain opportunities from top
            companies
          </p>

          {/* Stats Card */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg border border-amber-100">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-2xl font-bold text-amber-600">
                {count > 0 ? count : 0}
              </span>
              <span className="text-gray-600 font-medium">
                {count === 1
                  ? "opportunity available"
                  : "opportunities available"}
              </span>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {Object.keys(searchParams).some(
          (key) =>
            key !== "page" &&
            key !== "items" &&
            searchParams[key as keyof typeof searchParams],
        ) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-100/50">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg mr-3 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Active Filters
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Do not display a chip for free-text keyword search */}
                {searchParams.location && (
                  <span className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-1" /> Location:{" "}
                    {searchParams.location}
                  </span>
                )}
                {searchParams.name && (
                  <span className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <Building className="w-4 h-4 mr-1" /> Company:{" "}
                    {searchParams.name}
                  </span>
                )}
                {searchParams.datePosted && searchParams.datePosted !== "any" && (
                  <span className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <CalendarClock className="w-4 h-4 mr-1" /> Posted:{" "}
                    {DATE_POSTED_LABELS[searchParams.datePosted] ?? "Recent"}
                  </span>
                )}
                {searchParams.jobType && searchParams.jobType !== "all" && (
                  <span className="bg-gradient-to-r from-slate-50 to-zinc-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <BriefcaseBusiness className="w-4 h-4 mr-1" /> Type:{" "}
                    {JOB_TYPE_LABELS[searchParams.jobType] ?? searchParams.jobType}
                  </span>
                )}
                {searchParams.engagement && searchParams.engagement !== "any" && (
                  <span className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" /> Engagement:{" "}
                    {ENGAGEMENT_LABELS[searchParams.engagement] ?? searchParams.engagement}
                  </span>
                )}
                {searchParams.budgetRange && (
                  <span className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <Wallet className="w-4 h-4 mr-1" /> Budget:{" "}
                    {formatBudgetRange(searchParams.budgetRange)}
                  </span>
                )}
                {openToRecruiterFilter === "true" && (
                  <span className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <UserCheck className="w-4 h-4 mr-1" /> Open to Recruiters
                  </span>
                )}
                {searchParams.mentor === "true" && (
                  <span className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <GraduationCap className="w-4 h-4 mr-1" /> Open to Mentors
                  </span>
                )}
                {searchParams.openToTalents === "true" && (
                  <span className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <User className="w-4 h-4 mr-1" /> Open to Talents
                  </span>
                )}
                {searchParams.sort && searchParams.sort !== "latest" && (
                  <span className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 text-sky-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <ArrowDownUp className="w-4 h-4 mr-1" /> Sort:{" "}
                    {SORT_LABELS[searchParams.sort] ?? searchParams.sort}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Section */}
        <div className="">
          {jobs.length > 0 ? (
            <JobResult jobOffers={jobs} />
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Search className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  No opportunities found
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We couldn't find any jobs matching your criteria. Try
                  adjusting your filters or check back later for new
                  opportunities.
                </p>
                <a
                  href="/talents/job-search"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Clear All Filters
                </a>
              </div>
            </div>
          )}

          {count > itemsPerPage && (
            <div className="mt-12 flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-100">
                <Pagination
                  itemsPerPage={itemsPerPage}
                  totalItems={count}
                  query={query}
                  activePage={Number(searchParams.page) || 1}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
