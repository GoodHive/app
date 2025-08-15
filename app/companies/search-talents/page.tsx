import { Card } from "@/app/components/card";
import { Pagination } from "@/app/components/pagination";
import { fetchTalents } from "@/lib/talents";
import { Metadata } from "next";
import { 
  Users, 
  CheckCircle, 
  Wrench, 
  MapPin, 
  User, 
  Briefcase, 
  GraduationCap, 
  UserTie, 
  Search, 
  FolderOpen 
} from "lucide-react";

export const metadata: Metadata = {
  title: "Search Talents - Find Web3 & Blockchain Professionals | GoodHive",
  description:
    "Search and discover top Web3 developers, blockchain experts, and crypto professionals. Connect with skilled talent for your decentralized projects and blockchain initiatives.",
  keywords:
    "search Web3 developers, blockchain talent, crypto professionals, decentralized experts, smart contract developers, DeFi talent search",
};

const itemsPerPage = 10;

export const revalidate = 0;

export default async function SearchTalentsPage({
  searchParams,
}: {
  searchParams: {
    items?: number;
    page: number;
    search?: string;
    location?: string;
    name?: string;
    onlyTalent?: string;
    onlyMentor?: string;
    onlyRecruiter?: string;
  };
}) {
  console.log("Search params received:", searchParams);

  const query = { items: itemsPerPage, ...searchParams };
  const { talents, count } = (await fetchTalents(query)) || {
    talents: [],
    count: 0,
  };

  console.log("Talents found:", talents.length);
  console.log("Total count:", count);

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

      <div className="p-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl mb-6 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Discover Top Talent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Connect with skilled Web3 developers, blockchain experts, and crypto
            professionals
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
                  ? "professional available"
                  : "professionals available"}
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
                {searchParams.search && (
                  <span className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <Wrench className="w-4 h-4 mr-1" /> Skills:{" "}
                    {searchParams.search}
                  </span>
                )}
                {searchParams.location && (
                  <span className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-1" /> Location:{" "}
                    {searchParams.location}
                  </span>
                )}
                {searchParams.name && (
                  <span className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <User className="w-4 h-4 mr-1" /> Name: {searchParams.name}
                  </span>
                )}
                {searchParams.onlyTalent === "true" && (
                  <span className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" /> Talent Only
                  </span>
                )}
                {searchParams.onlyMentor === "true" && (
                  <span className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <GraduationCap className="w-4 h-4 mr-1" /> Mentor Only
                  </span>
                )}
                {searchParams.onlyRecruiter === "true" && (
                  <span className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center">
                    <UserTie className="w-4 h-4 mr-1" /> Recruiter Only
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Talents Section */}
        <div className="p-8">
          {talents.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 gap-6">
              {talents.map((talent) => (
                <div key={talent.phoneNumber} className="group relative">
                  <Card
                    type="talent"
                    title={talent.title}
                    postedBy={`${talent.firstName} ${talent.lastName}`}
                    postedOn={talent.last_active} // TODO: use real data instead when available
                    image={talent.imageUrl}
                    country={talent.country} // TODO: create flag table
                    city={talent.city}
                    budget={Number(talent.rate)}
                    projectType="hourly"
                    currency={talent.currency}
                    description={talent.description}
                    skills={talent.skills}
                    buttonText="Connect"
                    walletAddress={talent.walletAddress}
                    freelancer={talent.freelancer}
                    remote={talent.remote}
                    availability={talent.availability}
                    last_active={talent.last_active}
                    uniqueId={talent.userId}
                  />
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Search className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  No talent found
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We couldn't find any talent matching your criteria. Try
                  adjusting your filters or check back later for new
                  professionals.
                </p>
                <a
                  href="/companies/search-talents"
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
                  isSearchTalent={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
