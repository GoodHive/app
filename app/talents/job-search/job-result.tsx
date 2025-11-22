"use client";
import "@/app/styles/rich-text.css";
import moment from "moment";
import { Card } from "../../components/card";

// TypeScript interface for the actual job offer data from API
export interface ApiJobOffer {
  id: string;
  title: string;
  companyName: string;
  posted_at: Date;
  image_url: string;
  country: string;
  city: string;
  budget: string;
  projectType: "fixed" | "hourly";
  currency: string;
  jobDescription: string;
  skills: string[];
  walletAddress?: string;
  talent: boolean;
  mentor: boolean;
  recruiter: boolean;
  escrowAmount: boolean;
  user_id: string;
  in_saving_stage: boolean;
  duration: string;
  typeEngagement: string;
  published: boolean;
  block_id?: number;
}

// Legacy interface for modal (keeping for compatibility)
export interface JobOffer {
  id: number;
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  jobDescription: string;
  duration: string;
  image: string;
  country: string;
  city: string;
  rate: number;
  typeEngagement: string;
  currency: string;
  skills: string[];
  buttonText: string;
  escrowAmount: boolean;
  walletAddress?: string;
}

export default function JobResult({ jobOffers }: { jobOffers: ApiJobOffer[] }) {
  console.log("Job offers received:", jobOffers.length);
  console.log("Sample job offer:", jobOffers[0]);
  console.log(
    "Talent/Mentor/Recruiter values:",
    jobOffers.map((job) => ({
      id: job.id,
      title: job.title,
      talent: job.talent,
      mentor: job.mentor,
      recruiter: job.recruiter,
    })),
  );

  const filteredJobs = jobOffers.filter((job) => !job.in_saving_stage);

  if (filteredJobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🐝</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No jobs available
        </h3>
        <p className="text-gray-500">Check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Showing {filteredJobs.length}{" "}
            {filteredJobs.length === 1 ? "job" : "jobs"}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {moment().format("MMM DD, YYYY")}
        </div>
      </div>

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJobs.map((jobOffer, index) => {
          console.log("Job Offer", jobOffer.id, ":", {
            title: jobOffer.title,
            talent: jobOffer.talent,
            mentor: jobOffer.mentor,
            recruiter: jobOffer.recruiter,
            type: typeof jobOffer.talent,
          });
          return (
            <div key={`job-${jobOffer.id}-${index}`} className="group relative">
              <Card
                uniqueId={jobOffer?.user_id}
                jobId={jobOffer.id || undefined}
                blockId={jobOffer.block_id}
                type="job"
                title={jobOffer.title || "Job Position"}
                postedBy={jobOffer.companyName || "Company"}
                postedOn={`Posted ${moment(jobOffer.posted_at).fromNow()}`}
                image={jobOffer.image_url || "/img/company_img.png"}
                country={jobOffer.country || ""}
                city={jobOffer.city || "Remote"}
                budget={Number(jobOffer.budget) || 0}
                projectType={jobOffer.projectType || "hourly"}
                currency={jobOffer.currency || "€"}
                description={
                  jobOffer.jobDescription ||
                  "No description available for this position."
                }
                skills={
                  jobOffer.skills && Array.isArray(jobOffer.skills)
                    ? jobOffer.skills
                    : []
                }
                buttonText="Apply"
                walletAddress={jobOffer.walletAddress}
                talent={jobOffer.talent}
                mentor={jobOffer.mentor}
                recruiter={jobOffer.recruiter}
                escrowAmount={jobOffer.escrowAmount || false}
              />

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-amber-200/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-amber-600">
              {filteredJobs.length}
            </div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-orange-600">
              {filteredJobs.filter((job) => job.talent).length}
            </div>
            <div className="text-sm text-gray-600">Open to Talents</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-blue-600">
              {filteredJobs.filter((job) => job.mentor).length}
            </div>
            <div className="text-sm text-gray-600">Open to Mentors</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-green-600">
              {filteredJobs.filter((job) => job.recruiter).length}
            </div>
            <div className="text-sm text-gray-600">Open to Recruiters</div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-amber-200/20">
            <div className="text-2xl font-bold text-purple-600">
              {filteredJobs.filter((job) => job.escrowAmount).length}
            </div>
            <div className="text-sm text-gray-600">With Escrow</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// export const JobResultModal = ({
//   jobOffer,
//   onClose,
// }: {
//   jobOffer: JobOffer;
//   onClose: () => void;
// }) => {
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white p-8 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-900">{jobOffer.title}</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         <div className="rich-text-content mt-4 prose prose-gray max-w-none">
//           <div dangerouslySetInnerHTML={{ __html: jobOffer.jobDescription }} />
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
//           <div className="space-y-3">
//             <div>
//               <span className="text-sm font-semibold text-gray-600">Duration:</span>
//               <p className="text-gray-900">{jobOffer.duration}</p>
//             </div>
//             <div>
//               <span className="text-sm font-semibold text-gray-600">Location:</span>
//               <p className="text-gray-900">{jobOffer.city}, {jobOffer.country}</p>
//             </div>
//           </div>
//           <div className="space-y-3">
//             <div>
//               <span className="text-sm font-semibold text-gray-600">Rate:</span>
//               <p className="text-gray-900 font-semibold">{jobOffer.rate} {jobOffer.currency}</p>
//             </div>
//             <div>
//               <span className="text-sm font-semibold text-gray-600">Type:</span>
//               <p className="text-gray-900">{jobOffer.typeEngagement}</p>
//             </div>
//           </div>
//         </div>

//         <div className="mt-6">
//           <h3 className="font-semibold mb-3 text-gray-900">Required Skills:</h3>
//           <div className="flex flex-wrap gap-2">
//             {jobOffer.skills.map((skill, index) => (
//               <span
//                 key={index}
//                 className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium border border-amber-200"
//               >
//                 {skill}
//               </span>
//             ))}
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
//           >
//             Close
//           </button>
//           <button className="px-6 py-2 bg-[#FFC905] hover:bg-[#FF8C05] text-black rounded-lg transition-colors duration-200 font-medium shadow-sm">
//             Apply Now
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
