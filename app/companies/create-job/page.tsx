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
import BlockchainDebug from "@/app/components/BlockchainDebug";
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {id ? "Edit Job" : "Create New Job"}
          </h1>

          {/* Temporary debug component */}
          <BlockchainDebug />
          
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
        </div>
      </div>
    </AuthLayout>
  );
}
