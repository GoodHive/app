import FundManager from "@/app/components/FundManager";
import JobSectionsManager from "@/app/components/job-sections-manager/job-sections-manager";
import ProfileImageUpload from "@/app/components/profile-image-upload";
import { useProtectedNavigation } from "@/app/hooks/useProtectedNavigation";
import "@/app/styles/rich-text.css";
import {
  calculateJobCreateFees,
  getBudgetLabel,
  getFeeDisplaySuffix,
} from "@/app/utils/calculate-job-create-fees";
import { ACTIVE_CHAIN_ID } from "@/config/chains";
import { useJobManager } from "@/hooks/contracts/useJobManager";
import { getSupportedTokensForChain } from "@/lib/contracts/jobManager";
import { AutoSuggestInput } from "@components/autosuggest-input";
import { SelectInput } from "@components/select-input";
import { ToggleButton } from "@components/toggle-button";
import { chains } from "@constants/chains";
import {
  createJobServices,
  ethereumTokens,
  gnosisChainTokens,
  jobTypes,
  polygonMainnetTokens,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@constants/common";
import { skills } from "@constants/skills";
import { IJobSection } from "@interfaces/job-offer";
import LabelOption from "@interfaces/label-option";
import { Tooltip } from "@nextui-org/tooltip";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import "react-quill/dist/quill.snow.css";
import { useActiveAccount } from "thirdweb/react";

const mapToChainId = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = value.toString().toLowerCase();

  if (
    [
      "polygon",
      "polygon-mainnet",
      "matic",
      "matic-mainnet",
      "polygon_mainnet",
    ].includes(normalized)
  ) {
    return 137;
  }

  if (
    [
      "polygon-amoy",
      "amoy",
      "polygon_testnet",
      "polygon-amoy-testnet",
      "polygon-mumbai",
    ].includes(normalized)
  ) {
    return 80002;
  }

  if (
    ["gnosis", "gnosis-chain", "chiado", "gnosis chain"].includes(normalized)
  ) {
    return 100;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// Note: ReactQuill is now used within individual JobSectionEditor components

interface JobFormProps {
  isLoading: boolean;
  companyData: any;
  jobData: any;
  title: string;
  setTitle: (title: string) => void;
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
  description: string;
  setDescription: (description: string) => void;
  jobSections: IJobSection[];
  setJobSections: (sections: IJobSection[]) => void;
  jobServices: {
    talent: boolean;
    recruiter: boolean;
    mentor: boolean;
  };
  setJobServices: (services: any) => void;
  budget: string;
  setBudget: (budget: string) => void;
  jobImage: string | null;
  setJobImage: (image: string) => void;
  selectedChain: LabelOption | null;
  setSelectedChain: (chain: LabelOption | null) => void;
  selectedCurrency: LabelOption | null;
  setSelectedCurrency: (currency: LabelOption | null) => void;
  typeEngagement: LabelOption | null;
  setTypeEngagement: (engagement: LabelOption | null) => void;
  jobType: LabelOption | null;
  setJobType: (type: LabelOption | null) => void;
  duration: LabelOption | null;
  setDuration: (duration: LabelOption | null) => void;
  projectType: LabelOption | null;
  setProjectType: (type: LabelOption | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPopupModalOpen: (open: boolean) => void;
  setPopupModalType: (type: string) => void;
  handleCreateJob: (jobId: string, amount: string) => Promise<boolean>;
}

export const JobForm = ({
  isLoading,
  companyData,
  jobData,
  title,
  setTitle,
  selectedSkills,
  setSelectedSkills,
  description,
  setDescription,
  jobSections,
  setJobSections,
  jobServices,
  setJobServices,
  budget,
  setBudget,
  jobImage,
  setJobImage,
  selectedChain,
  setSelectedChain,
  selectedCurrency,
  setSelectedCurrency,
  typeEngagement,
  setTypeEngagement,
  jobType,
  setJobType,
  duration,
  setDuration,
  projectType,
  setProjectType,
  setIsLoading,
  setIsPopupModalOpen,
  setPopupModalType,
  handleCreateJob,
}: JobFormProps) => {
  const [isCommissionExpanded, setIsCommissionExpanded] = useState(false);
  const [showFundManager, setShowFundManager] = useState(false);
  const { navigate: protectedNavigate } = useProtectedNavigation();

  const jobChainLabel = useMemo(
    () => jobData?.chain ?? selectedChain?.value ?? null,
    [jobData?.chain, selectedChain?.value],
  );

  const jobChainId = useMemo(
    () => mapToChainId(jobChainLabel),
    [jobChainLabel],
  );

  const currentBlockchainJobId = useMemo(() => {
    if (!jobData) {
      return null;
    }

    const rawId =
      jobData.blockchainJobId ??
      jobData.blockchain_job_id ??
      jobData.block_id ??
      jobData.job_id ??
      null;

    if (rawId === null || rawId === undefined || rawId === "") {
      return null;
    }

    if (typeof rawId === "bigint") {
      return rawId.toString();
    }

    if (typeof rawId === "number") {
      return rawId.toString();
    }

    return rawId.toString();
  }, [jobData]);

  const onChainCurrency = useMemo(() => {
    const currency = selectedCurrency?.value || jobData?.currency;
    return currency ? currency.toUpperCase() : "";
  }, [selectedCurrency?.value, jobData?.currency]);

  const fundManagerTokenAddress = useMemo(() => {
    if (jobData?.payment_token_address) {
      return jobData.payment_token_address;
    }

    if (!jobChainId) {
      return "";
    }

    const supportedTokens = getSupportedTokensForChain(jobChainId);

    if (onChainCurrency === "USDC" && supportedTokens.USDC) {
      return supportedTokens.USDC;
    }

    if (onChainCurrency === "DAI" && supportedTokens.DAI) {
      return supportedTokens.DAI;
    }

    return supportedTokens.USDC || supportedTokens.DAI || "";
  }, [jobData?.payment_token_address, jobChainId, onChainCurrency]);

  // Web3 integration
  const account = useActiveAccount();
  const {
    createJob: createJobOnChain,
    isLoading: isBlockchainLoading,
    error: blockchainError,
  } = useJobManager();

  // Calculate total percentage of selected services
  const getTotalPercentage = () => {
    let total = 0;
    if (jobServices.talent) total += 10;
    if (jobServices.recruiter) total += 8;
    if (jobServices.mentor) total += 12;
    return total;
  };

  const onJobServicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedServices = {
      ...jobServices,
      [event.target.name]: event.target.checked,
    };
    setJobServices(updatedServices);
  };

  const onBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(event.target.value);
  };

  // Handle saving/creating a job
  const handleSaveJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!companyData?.user_id) {
      toast.error("Please complete your company profile first");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Please provide a job title");
      return;
    }

    if (!selectedSkills.length) {
      toast.error("Please select at least one skill");
      return;
    }

    // Validate job sections
    if (!jobSections || jobSections.length === 0) {
      toast.error("Please add at least one job section");
      return;
    }

    // Validate each section
    for (const section of jobSections) {
      if (!section.heading.trim()) {
        toast.error("All sections must have a heading");
        return;
      }
      if (!section.content.trim()) {
        toast.error("All sections must have content");
        return;
      }
    }

    if (!budget.trim()) {
      toast.error("Please provide a budget");
      return;
    }

    setIsLoading(true);

    try {
      const jobPayload = {
        userId: companyData.user_id,
        title: title,
        typeEngagement: typeEngagement?.value || "freelance",
        description: description,
        duration: duration?.value || "moreThanSevenDays",
        budget: budget,
        skills: selectedSkills.join(", "),
        chain: selectedChain?.value || "polygon",
        currency: selectedCurrency?.value || "USD",
        walletAddress: companyData.wallet_address || "",
        city: companyData.city || "",
        country: companyData.country || "",
        imageUrl: jobImage || "",
        jobType: jobType?.value || "remote",
        companyName: companyData.company_name || "",
        projectType: projectType?.value || "fixed",
        talent: jobServices.talent,
        recruiter: jobServices.recruiter,
        mentor: jobServices.mentor,
        in_saving_stage: true, // Save as draft
        sections: jobSections,
      };

      const endpoint = jobData?.id
        ? "/api/companies/update-job"
        : "/api/companies/create-job";
      if (jobData?.id) {
        (jobPayload as any).id = jobData.id;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobPayload),
      });

      const data = await response.json();

      if (response.ok) {
        if (jobData?.id) {
          // If editing existing job, just reload
          toast.success("Job updated successfully");
          window.location.reload();
        } else {
          // If creating new job, redirect to edit page with new job ID
          toast.success("Job saved as draft");
          const newJobId = data.jobId;
          if (newJobId) {
            window.location.href = `/companies/create-job?id=${newJobId}`;
          } else {
            window.location.reload();
          }
        }
      } else {
        throw new Error(data.message || "Failed to save job");
      }
    } catch (error: any) {
      console.error("Error saving job:", error);
      toast.error(error.message || "Failed to save job");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle managing funds
  const onManageFundsClick = () => {
    if (!account) {
      toast.error("Please connect your wallet to manage funds");
      return;
    }
    if (!currentBlockchainJobId) {
      toast.error("Job not published on blockchain yet");
      return;
    }
    const readableChainName = jobChainLabel
      ? jobChainLabel
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : "the correct network";
    if (jobChainId && jobChainId !== ACTIVE_CHAIN_ID) {
      toast.error(
        `This job is published on the ${readableChainName} network. Please switch your wallet to that network to manage funds.`,
      );
      return;
    }

    if (!onChainCurrency || !["USDC", "DAI"].includes(onChainCurrency)) {
      toast.error(
        "Funds can only be managed for jobs published with USDC or DAI. Please update the job currency before managing funds.",
      );
      return;
    }

    if (!fundManagerTokenAddress) {
      toast.error(
        "Unable to determine the token address for this job. Please republish the job or contact support.",
      );
      return;
    }
    setShowFundManager(true);
  };

  // Handle canceling/deleting a job
  const handleCancelJob = async () => {
    if (!jobData?.id) return;

    if (!confirm("Are you sure you want to cancel this job?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies/delete-job`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: jobData.id }),
      });

      if (response.ok) {
        toast.success("Job cancelled successfully");
        protectedNavigate("/companies/my-profile", {
          authDescription: "access your company profile",
        });
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel job");
      }
    } catch (error: any) {
      console.error("Error cancelling job:", error);
      toast.error(error.message || "Failed to cancel job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublishJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/companies/manage-job`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: jobData?.id,
          publish: false,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Job unpublished successfully");
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to unpublish job");
      }
    } catch (error: any) {
      console.error("Error unpublishing job:", error);
      toast.error(error.message || "Failed to unpublish job");
    }
  };

  const handlePublishJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!companyData?.user_id) {
      toast.error("Please complete your company profile first");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Please provide a job title");
      return;
    }

    if (!selectedSkills.length) {
      toast.error("Please select at least one skill");
      return;
    }

    // Validate job sections
    if (!jobSections || jobSections.length === 0) {
      toast.error("Please add at least one job section");
      return;
    }

    // Validate each section
    for (const section of jobSections) {
      if (!section.heading.trim()) {
        toast.error("All sections must have a heading");
        return;
      }
      if (!section.content.trim()) {
        toast.error("All sections must have content");
        return;
      }
    }

    if (!budget.trim()) {
      toast.error("Please provide a budget");
      return;
    }

    // Web3 validation
    if (!account) {
      toast.error("Please connect your wallet to publish jobs");
      return;
    }

    setIsLoading(true);

    try {
      let databaseJobId = jobData?.id as string | undefined;

      if (!databaseJobId) {
        // Create job in database first
        const jobPayload = {
          userId: companyData.user_id,
          title: title,
          typeEngagement: typeEngagement?.value || "freelance",
          description: description,
          duration: duration?.value || "moreThanSevenDays",
          budget: budget,
          skills: selectedSkills.join(", "),
          chain: selectedChain?.value || "polygon",
          currency: selectedCurrency?.value || "USD",
          walletAddress: account.address,
          city: companyData.city || "",
          country: companyData.country || "",
          imageUrl: jobImage || "",
          jobType: jobType?.value || "remote",
          companyName: companyData.company_name || "",
          projectType: projectType?.value || "fixed",
          talent: jobServices.talent,
          recruiter: jobServices.recruiter,
          mentor: jobServices.mentor,
          in_saving_stage: false,
          sections: jobSections,
        };

        const response = await fetch("/api/companies/create-job", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobPayload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to create job in database");
        }

        databaseJobId = data.jobId;
      }

      if (!databaseJobId) {
        throw new Error("Failed to determine database job ID");
      }

      // Now create the job on blockchain
      toast.loading("Creating job on blockchain...");

      const supportedTokens = getSupportedTokensForChain(
        selectedChain?.value === "polygon" ? 137 : 80002,
      );

      const tokenAddress =
        selectedCurrency?.value === "USDC"
          ? supportedTokens.USDC
          : supportedTokens.DAI;

      if (!tokenAddress) {
        throw new Error("Selected token not supported on this chain");
      }

      const blockchainJobId = await createJobOnChain({
        databaseId: databaseJobId,
        tokenAddress,
        chain: selectedChain?.value || "polygon-amoy",
        talentService: jobServices.talent,
        recruiterService: jobServices.recruiter,
        mentorService: jobServices.mentor,
      });

      console.log(blockchainJobId, "blockchain Job id");

      toast.dismiss();

      if (!blockchainJobId) {
        throw new Error("Failed to create job on blockchain");
      }

      // Update database with blockchain job ID and publish
      const updateResponse = await fetch(`/api/companies/manage-job`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: databaseJobId,
          publish: true,
          in_saving_stage: false,
          blockchainJobId: blockchainJobId,
          paymentTokenAddress: tokenAddress,
        }),
      });

      if (updateResponse.ok) {
        toast.success("Job created and published on blockchain!");
        window.location.href = `/companies/create-job?id=${databaseJobId}`;
      } else {
        toast.success(
          "Job created on blockchain but failed to update database",
        );
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Error publishing job:", error);
      toast.error(error.message || "Failed to publish job");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form>
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-4">
          <div className="mt-4 flex justify-center">
            <div className="flex flex-col gap-2 items-center">
              <ProfileImageUpload
                currentImage={jobImage || companyData?.image_url || ""}
                displayName="Job Image"
                onImageUpdate={(imageUrl) => setJobImage(imageUrl)}
                variant="job"
                size={160}
              />
              <p className="text-sm text-gray-500">
                This image will be displayed on the job page.
              </p>
            </div>
          </div>
          <div className="flex-1">
            <label
              htmlFor="title"
              className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
            >
              Job Header*
            </label>
            <input
              className="block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
              placeholder="Job Header..."
              name="title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="w-full flex gap-5 justify-between sm:flex-col">
            <SelectInput
              labelText="Type of engagement"
              name="type-engagement"
              required={true}
              disabled={false}
              inputValue={typeEngagement}
              setInputValue={setTypeEngagement}
              options={typeEngagements}
              defaultValue={
                typeEngagements[
                  typeEngagements.findIndex(
                    (type) => type.value === jobData?.typeEngagement,
                  )
                ]
              }
            />

            <SelectInput
              labelText="Job Type"
              name="job-type"
              required={true}
              disabled={false}
              inputValue={jobType}
              setInputValue={setJobType}
              options={jobTypes}
              defaultValue={
                jobTypes[
                  jobTypes.findIndex((type) => type.value === jobData?.jobType)
                ]
              }
            />
          </div>
        </div>
        <div className="flex flex-col w-full mt-4">
          <JobSectionsManager
            sections={jobSections}
            onSectionsChange={setJobSections}
          />
        </div>
        <div className="relative flex flex-col gap-4 mt-12 mb-10 sm:flex-row">
          <div className="flex-1">
            <label
              htmlFor="skills"
              className="inline-block ml-3 text-base font-bold text-black form-label"
            >
              Mandatory Skills*
            </label>
            <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
              <AutoSuggestInput
                inputs={skills}
                selectedInputs={selectedSkills}
                setSelectedInputs={setSelectedSkills}
              />
            </div>
            <div className="pt-10">
              {!!selectedSkills && selectedSkills.length > 0 && (
                <div className="flex flex-wrap mt-4 ">
                  {selectedSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                    >
                      <span className="mr-2">{skill}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSkills(
                            selectedSkills.filter((_, i) => i !== index),
                          );
                        }}
                        className="w-6 text-black bg-gray-400 rounded-full"
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:flex-wrap sm:gap-5">
          {createJobServices.map((service) => {
            const { label, value, tooltip } = service;
            const isChecked = jobServices[value as keyof typeof jobServices];
            const isTalent = value === "talent";
            return (
              <ToggleButton
                key={value}
                label={label}
                name={value}
                checked={isChecked}
                tooltip={tooltip}
                onChange={onJobServicesChange}
                disabled={isTalent}
              />
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 sm:flex-col">
          <div className="flex-1">
            <SelectInput
              labelText="Project Duration"
              name="duration"
              required={true}
              disabled={false}
              inputValue={duration}
              setInputValue={setDuration}
              options={projectDuration}
              defaultValue={
                projectDuration[
                  projectDuration.findIndex(
                    (type) => type.value === jobData?.duration,
                  )
                ]
              }
            />
          </div>

          <div className="flex-1">
            <SelectInput
              labelText="Project Type"
              name="projectType"
              required={true}
              disabled={false}
              inputValue={projectType}
              setInputValue={setProjectType}
              options={projectTypes}
              defaultValue={
                projectTypes[
                  projectTypes.findIndex(
                    (type) => type.value === jobData?.projectType,
                  )
                ]
              }
            />
          </div>
          {projectType || jobData?.projectType ? (
            <div className="flex-1">
              <label
                htmlFor="budget"
                className="inline-block ml-3 text-base text-gray-800 form-label mb-2 font-medium"
              >
                {projectType && projectType.value === "fixed"
                  ? "Budget*"
                  : "Expected Hourly Rate*"}
              </label>
              <input
                className="block w-full px-4 py-3 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-amber-300 rounded-xl hover:shadow-md transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-amber-500 focus:outline-none"
                type="number"
                name="budget"
                onChange={onBudgetChange}
                required
                value={budget}
                maxLength={100}
                title="Enter budget amount"
                placeholder="Enter amount"
              />
            </div>
          ) : null}
        </div>

        {/* GoodHive Commission Section */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsCommissionExpanded(!isCommissionExpanded)}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">
                GoodHive Commission Breakdown
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-bold text-yellow-600">
                  {getTotalPercentage()}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-xl font-bold text-yellow-600">
                  {budget && Number(budget) > 0
                    ? selectedCurrency?.label
                      ? `${calculateJobCreateFees(projectType, budget, jobServices)} ${selectedCurrency.label}${getFeeDisplaySuffix(projectType)}`
                      : `${calculateJobCreateFees(projectType, budget, jobServices)} ${jobData?.currency || "USDC"}${getFeeDisplaySuffix(projectType)}`
                    : `Enter ${getBudgetLabel(projectType).toLowerCase()} to see fees`}
                </p>
              </div>
              <div
                className={`transform transition-transform duration-200 ${isCommissionExpanded ? "rotate-180" : ""}`}
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {isCommissionExpanded && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {jobServices.talent && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Talent Selection
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        10%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Self-selection fee
                    </p>
                    {budget && Number(budget) > 0 && (
                      <p className="text-sm font-semibold mt-1">
                        {(Number(budget) * 0.1).toFixed(2)}{" "}
                        {selectedCurrency?.label || jobData?.currency || "USDC"}
                        {getFeeDisplaySuffix(projectType)}
                      </p>
                    )}
                  </div>
                )}

                {jobServices.recruiter && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Recruiter Service
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        8%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Talent curation fee
                    </p>
                    {budget && Number(budget) > 0 && (
                      <p className="text-sm font-semibold mt-1">
                        {(Number(budget) * 0.08).toFixed(2)}{" "}
                        {selectedCurrency?.label || jobData?.currency || "USDC"}
                        {getFeeDisplaySuffix(projectType)}
                      </p>
                    )}
                  </div>
                )}

                {jobServices.mentor && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Mentor Service
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        12%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Technical mentoring fee
                    </p>
                    {budget && Number(budget) > 0 && (
                      <p className="text-sm font-semibold mt-1">
                        {(Number(budget) * 0.12).toFixed(2)}{" "}
                        {selectedCurrency?.label || jobData?.currency || "USDC"}
                        {getFeeDisplaySuffix(projectType)}
                      </p>
                    )}
                  </div>
                )}

                {!jobServices.talent &&
                  !jobServices.recruiter &&
                  !jobServices.mentor && (
                    <div className="col-span-full text-center py-4">
                      <p className="text-gray-500">
                        Select at least one service above to see commission
                        breakdown
                      </p>
                    </div>
                  )}
              </div>

              {budget &&
                Number(budget) > 0 &&
                (jobServices.talent ||
                  jobServices.recruiter ||
                  jobServices.mentor) && (
                  <div className="mt-3 p-2 bg-gray-100 rounded text-center">
                    <p className="text-xs text-gray-600">
                      {projectType?.value === "fixed" ? (
                        <>
                          Total Project Cost:{" "}
                          <span className="font-semibold">
                            {(
                              Number(budget) +
                              Number(
                                calculateJobCreateFees(
                                  projectType,
                                  budget,
                                  jobServices,
                                ) || 0,
                              )
                            ).toFixed(2)}{" "}
                            {selectedCurrency?.label ||
                              jobData?.currency ||
                              "USDC"}
                          </span>
                        </>
                      ) : (
                        <>
                          Total Rate:{" "}
                          <span className="font-semibold">
                            {(
                              Number(budget) +
                              Number(
                                calculateJobCreateFees(
                                  projectType,
                                  budget,
                                  jobServices,
                                ) || 0,
                              )
                            ).toFixed(2)}{" "}
                            {selectedCurrency?.label ||
                              jobData?.currency ||
                              "USDC"}
                            /hr
                          </span>
                          <span className="block text-xs text-gray-500 mt-1">
                            ({getBudgetLabel(projectType)}:{" "}
                            {Number(budget).toFixed(2)} + Commission:{" "}
                            {calculateJobCreateFees(
                              projectType,
                              budget,
                              jobServices,
                            )}{" "}
                            per hour)
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-4 sm:flex-col">
          <div className="flex-1">
            <SelectInput
              labelText="Chain"
              name="chain"
              required={true}
              disabled={true}
              inputValue={selectedChain}
              setInputValue={setSelectedChain}
              options={chains}
              defaultValue={
                chains[
                  chains.findIndex((type) => type.value === jobData?.chain)
                ] || chains[0]
              }
            />
          </div>
          <div className="flex-1">
            <SelectInput
              labelText="Currency"
              name="currency"
              required={true}
              disabled={!selectedChain}
              inputValue={selectedCurrency}
              setInputValue={setSelectedCurrency}
              options={
                selectedChain?.value === "ethereum"
                  ? ethereumTokens
                  : selectedChain?.value === "polygon"
                    ? polygonMainnetTokens
                    : selectedChain?.value === "gnosis-chain"
                      ? gnosisChainTokens
                      : []
              }
              defaultValue={
                polygonMainnetTokens[
                  polygonMainnetTokens.findIndex(
                    (token) => token.value === jobData?.currency,
                  )
                ]
              }
            />
          </div>
        </div>

        {/* Wallet Connection Status */}
        {!account && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Wallet Required
                </h3>
                <p className="text-sm text-gray-600">
                  Connect your wallet to publish jobs on the blockchain and
                  manage funds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Error Display */}
        {blockchainError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">❌</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Blockchain Error
                </h3>
                <p className="text-sm text-red-600">{blockchainError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 mb-8 w-full flex justify-end gap-4 text-right">
          {!!jobData?.job_id && (
            <Tooltip content="Provisioning funds boost swift community response to your job offer.">
              <button
                className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out cursor-pointer"
                type="button"
                onClick={onManageFundsClick}
                disabled={
                  isLoading || isBlockchainLoading || !currentBlockchainJobId
                }
              >
                Manage Funds
              </button>
            </Tooltip>
          )}
          {!!jobData?.job_id && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out cursor-pointer"
              type="button"
              onClick={handleCancelJob}
              disabled={isLoading}
            >
              Cancel Job
            </button>
          )}

          {isLoading || isBlockchainLoading ? (
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
              type="submit"
              disabled
            >
              {isBlockchainLoading
                ? "Processing on blockchain..."
                : "Saving..."}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleSaveJob}
                className="my-2 text-base font-semibold bg-transparent h-14 w-56 rounded-full border-2 border-[#FFC905] transition-all duration-300 hover:bg-[#FFC905] cursor-pointer"
                disabled={
                  isLoading || isBlockchainLoading || !companyData?.user_id
                }
              >
                Save Job
              </button>

              {!jobData?.published && (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full transition-all duration-300 hover:bg-transparent hover:border-2 hover:border-[#FFC905] cursor-pointer"
                  type="button"
                  onClick={handlePublishJob}
                  disabled={
                    isLoading ||
                    isBlockchainLoading ||
                    !companyData?.user_id ||
                    !account
                  }
                >
                  {account
                    ? "Publish on Blockchain"
                    : "Connect Wallet to Publish"}
                </button>
              )}
              {jobData?.published && (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full transition-all duration-300 hover:bg-transparent hover:border-2 hover:border-[#FFC905] cursor-pointer"
                  type="button"
                  onClick={handleUnpublishJob}
                  disabled={
                    isLoading || isBlockchainLoading || !companyData?.user_id
                  }
                >
                  Unpublish Job
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fund Manager Modal */}
      {showFundManager && currentBlockchainJobId && (
        <FundManager
          jobId={currentBlockchainJobId}
          databaseJobId={jobData.id}
          tokenAddress={fundManagerTokenAddress}
          jobChainId={jobChainId}
          jobChainLabel={jobChainLabel ?? undefined}
          onClose={() => setShowFundManager(false)}
        />
      )}
    </form>
  );
};
