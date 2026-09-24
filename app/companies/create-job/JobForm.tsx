import FundManager from "@/app/components/FundManager";
import JobBalance from "@/app/components/JobBalance";
import { JobDescriptionAIBuilder } from "@/app/components/JobDescriptionAIBuilder";
import { BlockchainActivateModal } from "@/app/components/BlockchainActivateModal";
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
  polygonAmoyTokens,
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
  onRefreshJobData?: () => Promise<void>;
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
  onRefreshJobData,
}: JobFormProps) => {
  const [isCommissionExpanded, setIsCommissionExpanded] = useState(false);
  const [showFundManager, setShowFundManager] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
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
      jobData.block_id ??
      jobData.blockchainJobId ??
      jobData.blockchain_job_id ??
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
  const currentReviewStatus = jobData?.review_status || "draft";
  const isReadOnlyReviewState =
    currentReviewStatus === "pending_review" ||
    currentReviewStatus === "approved";
  // Live jobs stay editable, but chain, currency and services are fixed on-chain.
  const isLiveJob = currentReviewStatus === "active";

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
    isLoading: isBlockchainLoading,
    error: blockchainError,
    createJob,
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
        chain: selectedChain?.value || "polygon-amoy",
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
        ? `/api/jobs/${jobData.id}`
        : "/api/companies/create-job";

      const response = await fetch(endpoint, {
        method: jobData?.id ? "PATCH" : "POST",
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
        throw new Error(data.error || data.message || "Failed to save job");
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
          .replace(/\b\w/g, (char: string) => char.toUpperCase())
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

  const handleSubmitForReview = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
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
      let databaseJobId = jobData?.id as string | undefined;
      const jobPayload = {
        userId: companyData.user_id,
        title: title,
        typeEngagement: typeEngagement?.value || "freelance",
        description: description,
        duration: duration?.value || "moreThanSevenDays",
        budget: budget,
        skills: selectedSkills.join(", "),
        chain: selectedChain?.value || "polygon-amoy",
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
        in_saving_stage: true,
        sections: jobSections,
      };

      if (databaseJobId) {
        const saveResponse = await fetch(`/api/jobs/${databaseJobId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobPayload),
        });

        const saveData = await saveResponse.json();
        if (!saveResponse.ok) {
          throw new Error(
            saveData.error || "Failed to update job before review",
          );
        }
      } else {
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

      const submitResponse = await fetch(
        `/api/jobs/${databaseJobId}/submit-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const submitData = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(
          submitData.error || "Failed to submit job for review",
        );
      }

      toast.success("Job submitted for review successfully");
      window.location.href = `/companies/create-job?id=${databaseJobId}`;
    } catch (error: any) {
      console.error("Error submitting job for review:", error);
      toast.error(error.message || "Failed to submit job for review");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!account) {
      toast.error("Please connect your wallet to publish the job on blockchain");
      return;
    }

    if (!fundManagerTokenAddress) {
      toast.error("Unable to determine token address. Please set the job currency first.");
      return;
    }

    setIsLoading(true);
    const toastId = "publish-job";

    try {
      // Step 1: Create job on blockchain
      toast.loading("Creating job on blockchain…", { id: toastId });

      const result = await createJob({
        databaseId: jobData?.id,
        tokenAddress: fundManagerTokenAddress,
        chain: selectedChain?.value || jobData?.chain || "polygon-amoy",
        talentService: jobServices.talent || false,
        recruiterService: jobServices.recruiter || false,
        mentorService: jobServices.mentor || false,
      });

      if (!result) {
        toast.dismiss(toastId);
        // createJob already toasted the error
        return;
      }

      const {
        jobId: blockchainJobId,
        transactionHash,
        tokenAddress: onChainTokenAddress,
      } = result;

      // Step 2: Sync real blockchain ID to DB. Skipped when the job was
      // already on-chain and recovered — there's no new creation tx to record.
      if (transactionHash) {
        toast.loading("Syncing with database…", { id: toastId });

        await fetch("/api/blockchain/sync-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: jobData?.id,
            blockchainJobId,
            transactionHash,
            tokenAddress: onChainTokenAddress,
            contractAddress: "",
            status: "confirmed",
          }),
        });
      }

      // Step 3: Mark as published in DB with real blockchain ID
      toast.loading("Publishing…", { id: toastId });

      const updateResponse = await fetch("/api/companies/manage-job", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData?.id,
          publish: true,
          in_saving_stage: false,
          blockchainJobId,
          paymentTokenAddress: onChainTokenAddress,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.message || "Failed to publish job");
      }

      toast.success("Job published on blockchain!", { id: toastId });
      window.location.reload();
    } catch (error: any) {
      console.error("Error publishing job:", error);
      toast.error(error.message || "Failed to publish job", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form>
      {isReadOnlyReviewState && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          {currentReviewStatus === "pending_review" ? (
            "This job is currently under review. Editing is locked until admin action is taken."
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                ✅ Your job has been <strong>approved</strong>. Publish it to
                the blockchain and add a provision fund to make it live for
                talents.
              </span>
              <button
                type="button"
                onClick={() => setShowBlockchainModal(true)}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                ⚡ {jobData?.payment_token_address ? "Add Provision Fund" : "Publish to Blockchain"}
              </button>
            </div>
          )}
        </div>
      )}
      {isLiveJob && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
          This job is <strong>live</strong>. You can update the title,
          description, skills, and budget. Changes are visible to talents as
          soon as you save. Chain, currency, and services are fixed on-chain.
          Use <strong>Manage Funds</strong> below to add or withdraw funds.
        </div>
      )}
      {currentReviewStatus === "rejected" && jobData?.admin_feedback && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <strong>Admin feedback:</strong> {jobData.admin_feedback}
        </div>
      )}
      <fieldset
        className={`flex flex-col w-full ${isReadOnlyReviewState ? "opacity-70" : ""}`}
        disabled={isReadOnlyReviewState}
      >
        <div className="flex flex-col gap-4">
          <div className="mt-4 flex justify-center">
            <div className="flex flex-col gap-2 items-center" data-tour="job-image">
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

          {/* Job Balance Display */}
          {currentBlockchainJobId && (
            <div className="mt-6 mb-4 flex justify-center">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 max-w-md w-full">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Job Balance</h3>
                  <div className="text-2xl font-bold text-green-600">
                    <JobBalance
                      jobId={currentBlockchainJobId}
                      currency={selectedCurrency?.value || jobData?.currency || 'USDC'}
                      className="text-2xl font-bold text-green-600"
                      showLabel={false}
                      showCurrency={true}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Available funds in smart contract
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1" data-tour="job-title">
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
          <div className="w-full flex gap-5 justify-between sm:flex-col" data-tour="job-engagement">
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
        <div className="flex flex-col w-full mt-4" data-tour="job-description-ai">
          <JobDescriptionAIBuilder
            jobTitle={title}
            selectedSkills={selectedSkills}
            companyName={companyData?.designation ?? ""}
            companyBio={companyData?.headline ?? ""}
            onGenerated={(generatedTitle, generatedSections) => {
              if (generatedTitle) setTitle(generatedTitle);
              setJobSections(generatedSections);
            }}
          />
        </div>
        <div className="flex flex-col w-full mt-4" data-tour="job-sections">
          <JobSectionsManager
            sections={jobSections}
            onSectionsChange={setJobSections}
          />
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
            Paste rough notes if you need to. GoodHive will automatically polish messy section text with Gemini on save, then keep the public job page clean and structured for candidates.
          </div>
        </div>
        <div className="relative flex flex-col gap-4 mt-12 mb-10 sm:flex-row" data-tour="job-skills">
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

        <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:flex-wrap sm:gap-5" data-tour="job-services">
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
                disabled={isTalent || isLiveJob}
              />
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 sm:flex-col" data-tour="job-budget">
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
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-tour="job-commission">
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

        <div className="flex gap-4 mt-4 sm:flex-col" data-tour="job-chain">
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
              disabled={!selectedChain || isLiveJob}
              inputValue={selectedCurrency}
              setInputValue={setSelectedCurrency}
              options={
                selectedChain?.value === "ethereum"
                  ? ethereumTokens
                  : selectedChain?.value === "polygon"
                    ? polygonMainnetTokens
                    : selectedChain?.value === "polygon-amoy"
                      ? polygonAmoyTokens
                      : selectedChain?.value === "gnosis-chain"
                        ? gnosisChainTokens
                        : polygonAmoyTokens // Default to Polygon Amoy tokens
              }
              defaultValue={
                polygonAmoyTokens[
                  polygonAmoyTokens.findIndex(
                    (token) => token.value === jobData?.currency,
                  )
                ] || polygonAmoyTokens[0]
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
                  Wallet Optional For Drafting
                </h3>
                <p className="text-sm text-gray-600">
                  You can save drafts and submit jobs for review without a
                  wallet. Wallet connection is only needed later for
                  blockchain publishing and fund management.
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

        {!!jobData?.job_id &&
          !currentBlockchainJobId &&
          (currentReviewStatus === "draft" ||
            currentReviewStatus === "rejected") && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <span className="mt-0.5 text-yellow-500">⚡</span>
              <span>
                <strong>Provision funds before submitting.</strong> Adding USDC
                to your smart contract ensures your talent can be paid on-chain
                once the mission is complete.{" "}
                <button
                  type="button"
                  className="underline font-semibold hover:text-yellow-900"
                  onClick={onManageFundsClick}
                >
                  Manage Funds
                </button>
              </span>
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
          {!!jobData?.job_id && !isLiveJob && (
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
                data-tour="job-save-draft"
                onClick={handleSaveJob}
                className="my-2 text-base font-semibold bg-transparent h-14 w-56 rounded-full border-2 border-[#FFC905] transition-all duration-300 hover:bg-[#FFC905] cursor-pointer"
                disabled={
                  isLoading || isBlockchainLoading || !companyData?.user_id
                }
              >
                {isLiveJob ? "Save Changes" : "Save Draft"}
              </button>

              {!jobData?.published && currentReviewStatus !== "pending_review" && (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full transition-all duration-300 hover:bg-transparent hover:border-2 hover:border-[#FFC905] cursor-pointer"
                  type="button"
                  data-tour="job-submit-review"
                  onClick={handleSubmitForReview}
                  disabled={
                    isLoading ||
                    isBlockchainLoading ||
                    !companyData?.user_id
                  }
                >
                  {currentReviewStatus === "rejected"
                    ? "Resubmit for Review"
                    : "Submit for Review"}
                </button>
              )}
              {currentReviewStatus === "pending_review" && (
                <button
                  className="my-2 text-base font-semibold bg-gray-200 text-gray-600 h-14 w-56 rounded-full cursor-not-allowed"
                  type="button"
                  disabled
                >
                  Awaiting Review
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
      </fieldset>

      {/* Blockchain Activate Modal — shown for approved jobs from the banner button */}
      {showBlockchainModal && jobData?.id && (
        <BlockchainActivateModal
          isOpen={showBlockchainModal}
          job={{
            id: jobData.id,
            title: jobData.title ?? title,
            blockchainJobId: jobData.block_id ? Number(jobData.block_id) : null,
            chain: jobData.chain ?? null,
            paymentTokenAddress: jobData.payment_token_address ?? null,
            talentService: jobServices.talent,
            recruiterService: jobServices.recruiter,
            mentorService: jobServices.mentor,
          }}
          onClose={() => setShowBlockchainModal(false)}
          onActivated={() => {
            setShowBlockchainModal(false);
            if (onRefreshJobData) onRefreshJobData();
          }}
        />
      )}

      {/* Fund Manager Modal */}
      {showFundManager && currentBlockchainJobId && (
        <FundManager
          jobId={currentBlockchainJobId}
          databaseJobId={jobData.id}
          tokenAddress={fundManagerTokenAddress}
          jobChainId={jobChainId}
          jobChainLabel={jobChainLabel ?? undefined}
          onClose={() => {
            setShowFundManager(false);
            if (onRefreshJobData) {
              onRefreshJobData();
            }
          }}
        />
      )}
    </form>
  );
};
