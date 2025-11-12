"use client";

import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";
import { Loader } from "@components/loader";
import LabelOption from "@interfaces/label-option";
import { IJobSection } from "@interfaces/job-offer";
import { JobForm } from "./JobForm";
import { JobModals } from "./JobModals";
import { AiJobGeneratorModal } from "@/app/components/ai-job-generator/AiJobGeneratorModal";
import { chains } from "@/app/constants/chains";
import {
  typeEngagements,
  jobTypes,
  projectDuration,
  projectTypes,
  polygonMainnetTokens,
  ethereumTokens,
  gnosisChainTokens,
} from "@/app/constants/common";

export default function CreateJob() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobSections, setJobSections] = useState<IJobSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<LabelOption | null>(
    null,
  );
  const [selectedChain, setSelectedChain] = useState<LabelOption | null>(null);
  const [typeEngagement, setTypeEngagement] = useState<LabelOption | null>(
    null,
  );
  const [jobType, setJobType] = useState<LabelOption | null>(null);
  const [duration, setDuration] = useState<LabelOption | null>(null);
  const [projectType, setProjectType] = useState<LabelOption | null>(null);
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [jobData, setJobData] = useState<any | null>(null);
  const [budget, setBudget] = useState("");
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [popupModalType, setPopupModalType] = useState("");
  const [isManageFundsModalOpen, setIsManageFundsModalOpen] = useState(false);
  const [jobImage, setJobImage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [jobServices, setJobServices] = useState({
    talent: true,
    recruiter: false,
    mentor: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const addFunds = searchParams.get("addFunds");
  const userId = Cookies.get("user_id");

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!userId) {
        console.error("User not logged in");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/companies/my-profile?userId=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCompanyData(data);
        } else {
          console.error("Failed to fetch company data");
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchJobData = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/companies/job-data?id=${id}`);
          if (response.ok) {
            const data = await response.json();
            setJobData(data);

            // Set form fields from job data
            setTitle(data.title || "");
            setDescription(data.description || "");
            setBudget(data.budget || "");

            // Set job sections from data or create default from description
            if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
              setJobSections(data.sections);
            } else if (data.description && data.description.trim()) {
              // Convert existing description to first section for backward compatibility
              setJobSections([{
                heading: "Job Description",
                content: data.description,
                sort_order: 0,
              }]);
            } else {
              // Start with empty sections array
              setJobSections([]);
            }

            const normalizedSkills = Array.isArray(data.skills)
              ? data.skills.map((skill: string) => skill.trim()).filter(Boolean)
              : typeof data.skills === "string"
                ? data.skills
                    .split(",")
                    .map((skill: string) => skill.trim())
                    .filter(Boolean)
                : [];
            setSelectedSkills(normalizedSkills);

            setJobImage(data.image_url || null);

            const resolvedChain = chains.find(
              (chain) => chain.value === data.chain,
            );
            setSelectedChain(
              resolvedChain ||
                (data.chain
                  ? { value: data.chain, label: data.chain }
                  : null),
            );

            const tokenOptions =
              data.chain === "ethereum"
                ? ethereumTokens
                : data.chain === "gnosis-chain"
                  ? gnosisChainTokens
                  : polygonMainnetTokens;
            const resolvedCurrency = tokenOptions.find(
              (token) => token.value === data.currency,
            );
            setSelectedCurrency(
              resolvedCurrency ||
                (data.currency
                  ? { value: data.currency, label: data.currency }
                  : null),
            );

            const resolvedTypeEngagement = typeEngagements.find(
              (option) => option.value === data.typeEngagement,
            );
            setTypeEngagement(resolvedTypeEngagement || null);

            const resolvedJobType = jobTypes.find(
              (option) => option.value === data.jobType,
            );
            setJobType(resolvedJobType || null);

            const resolvedDuration = projectDuration.find(
              (option) => option.value === data.duration,
            );
            setDuration(resolvedDuration || null);

            const resolvedProjectType = projectTypes.find(
              (option) => option.value === data.projectType,
            );
            setProjectType(resolvedProjectType || null);

            setJobServices({
              talent: Boolean(data.talent),
              recruiter: Boolean(data.recruiter),
              mentor: Boolean(data.mentor),
            });
          }
        } catch (error) {
          console.error("Error fetching job data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCompanyData();
    fetchJobData();
  }, [userId, id]);

  const handleCreateJob = async (jobId: string, amount: string) => {
    // Authentication system being updated for Thirdweb integration
    toast("Job creation will be available after Thirdweb integration.", {
      icon: "🔧",
      duration: 4000,
    });
    return false;
  };

  const handleAiJobGenerated = (generatedData: any) => {
    try {
      // Populate form with AI-generated data
      setTitle(generatedData.title || "");

      // Set job sections
      if (generatedData.sections && Array.isArray(generatedData.sections)) {
        setJobSections(generatedData.sections);
      }

      // Set skills
      if (generatedData.skills && Array.isArray(generatedData.skills)) {
        setSelectedSkills(generatedData.skills);
      }

      // Set budget from estimated budget
      if (generatedData.estimatedBudget) {
        const avgBudget = Math.round((generatedData.estimatedBudget.min + generatedData.estimatedBudget.max) / 2);
        setBudget(avgBudget.toString());
      }

      // Set project type
      if (generatedData.projectType) {
        const projectTypeOption = projectTypes.find(pt => pt.value === generatedData.projectType);
        if (projectTypeOption) {
          setProjectType(projectTypeOption);
        }
      }

      // Set type engagement
      if (generatedData.typeEngagement) {
        const engagementOption = typeEngagements.find(te => te.value === generatedData.typeEngagement);
        if (engagementOption) {
          setTypeEngagement(engagementOption);
        }
      }

      // Set duration
      if (generatedData.duration) {
        const durationOption = projectDuration.find(pd => pd.value === generatedData.duration);
        if (durationOption) {
          setDuration(durationOption);
        }
      }

      // Set job type based on generated jobType
      if (generatedData.jobType) {
        const jobTypeOption = jobTypes.find(jt => jt.value === generatedData.jobType);
        if (jobTypeOption) {
          setJobType(jobTypeOption);
        }
      }

      toast.success("Job details populated successfully! You can now review and modify as needed.");
    } catch (error) {
      console.error("Error populating form:", error);
      toast.error("Error populating form data. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with AI button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {id ? "Edit Job" : "Create New Job"}
            </h1>

            {/* Show AI button only when creating new job (not editing) */}
            {!id && (
              <div className="flex justify-center sm:justify-end">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L13.09 8.26L19.5 7.5L14.74 12.26L15.5 18.5L12 15.5L8.5 18.5L9.26 12.26L4.5 7.5L10.91 8.26L12 2Z" />
                    <path d="M6 7L7 9L9 8L8 6L6 7Z" />
                    <path d="M18 16L19 18L21 17L20 15L18 16Z" />
                  </svg>
                  Create with AI
                </button>
              </div>
            )}
          </div>

          
          <JobForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            jobSections={jobSections}
            setJobSections={setJobSections}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            typeEngagement={typeEngagement}
            setTypeEngagement={setTypeEngagement}
            jobType={jobType}
            setJobType={setJobType}
            duration={duration}
            setDuration={setDuration}
            projectType={projectType}
            setProjectType={setProjectType}
            companyData={companyData}
            jobData={jobData}
            budget={budget}
            setBudget={setBudget}
            jobImage={jobImage}
            setJobImage={setJobImage}
            jobServices={jobServices}
            setJobServices={setJobServices}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setIsPopupModalOpen={setIsPopupModalOpen}
            setPopupModalType={setPopupModalType}
            handleCreateJob={handleCreateJob}
          />

          <JobModals
            isPopupModalOpen={isPopupModalOpen}
            setIsPopupModalOpen={setIsPopupModalOpen}
            popupModalType={popupModalType}
            isManageFundsModalOpen={isManageFundsModalOpen}
            setIsManageFundsModalOpen={setIsManageFundsModalOpen}
            jobData={jobData}
            selectedCurrency={selectedCurrency}
          />

          {/* AI Job Generator Modal */}
          <AiJobGeneratorModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            onJobGenerated={handleAiJobGenerated}
          />
        </div>
      </div>
    </AuthLayout>
  );
}
