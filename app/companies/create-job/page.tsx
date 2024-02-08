"use client";

import { Tooltip } from "@nextui-org/tooltip";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useCreateJob } from "@/app/hooks/create-job";
import { chains } from "@constants/chains";
import {
  createJobServices,
  jobTypes,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@constants/common";
import { skills } from "@constants/skills";
import {
  ethereumTokens,
  gnosisChainTokens,
} from "@constants/token-list/index.js";
import { polygonTestnetTokens } from "@constants/token-list/polygon";

import LabelOption from "@interfaces/label-option";
import { calculateJobCreateFees } from "@utils/calculate-job-create-fees";

import { AutoSuggestInput } from "@components/autosuggest-input";
import { AddressContext } from "@components/context";
import { Loader } from "@components/loader";
import Modal from "@components/modal";
import { SelectInput } from "@components/select-input";
import { ToggleButton } from "@components/toggle-button";
import { PopupModal } from "./PopupModal";

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<LabelOption | null>(
    null
  );
  const [selectedChain, setSelectedChain] = useState<LabelOption | null>(null);
  const [typeEngagement, setTypeEngagement] = useState<LabelOption | null>(
    null
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

  const [jobServices, setJobServices] = useState({
    talent: true,
    recruiter: false,
    mentor: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id"));
  const addFunds = searchParams.get("addFunds");
  const walletAddress = useContext(AddressContext);
  const provisionalAmount =
    jobData && Number(jobData.escrowAmount) > 0 ? jobData.escrowAmount : 0;

  const { createJobTx, withdrawFundsTx, checkBalanceTx, transferFundsTx } =
    useCreateJob({
      walletAddress,
    });

  const onPopupModalSubmit = async (
    amount: number,
    type: string,
    toAddress: string | null
  ) => {
    switch (type) {
      case "addFunds":
        const fundsRes = createJobTx(id, amount);
        toast.promise(fundsRes, {
          loading: "Adding funds...",
          success: "Funds added successfully!",
          error: "Error adding funds!",
        });
        handlePopupModalClose();
        break;
      case "withdraw":
        const WithdrawRes = withdrawFundsTx(id, amount);
        toast.promise(WithdrawRes, {
          loading: "Withdrawing funds...",
          success: "Funds withdrawn successfully!",
          error: "Error withdrawing funds!",
        });
        handlePopupModalClose();
        break;
      case "transfer":
        if (!toAddress) {
          toast.error("Please enter a valid transfer address!");
          return;
        }
        const transferRes = transferFundsTx(id, amount, toAddress);
        toast.promise(transferRes, {
          loading: "Transferring funds...",
          success: "Funds transferred successfully!",
          error: "Error transferring funds!",
        });
        handlePopupModalClose();
        break;
    }
  };

  const handleCancelJob = async () => {
    const balance = await checkBalanceTx(id);

    if (Number(balance) > 0) {
      toast.error(`Please withdraw all funds before cancelling the job!`);
      return;
    }
    toast.loading("Cancelling...", { duration: 2000 });
    const response = await fetch(`/api/companies/delete-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      toast.success("Job cancelled!");
      router.push(`/companies/${walletAddress}`);
    } else {
      toast.error("Something went wrong!");
      window.location.reload();
    }
  };

  const onManageFundsClick = () => {
    if (selectedChain?.value && selectedCurrency?.value) {
      setIsManageFundsModalOpen(true);
    } else {
      toast.error("Please select chain and currency first!");
    }
  };

  const handlePopupModal = (type: string) => {
    handleManageFundsModalClose();
    setPopupModalType(type);
    setIsPopupModalOpen(true);
  };

  const handleManageFundsModalClose = () => {
    setIsManageFundsModalOpen(false);
  };

  const handlePopupModalClose = () => {
    setIsPopupModalOpen(false);
    setPopupModalType("");
  };

  const onBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(event.target.value);
  };

  const totalFees = calculateJobCreateFees(projectType, budget, jobServices);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.loading("Saving...", { duration: 2000 });

    const formData = new FormData(e.currentTarget);

    const recruiter = formData.get("recruiter") === "on";
    const mentor = formData.get("mentor") === "on";

    const dataForm = {
      title: formData.get("title"),
      typeEngagement: typeEngagement ? typeEngagement.value : "",
      description: formData.get("description"),
      duration: duration ? duration?.value : "",
      ratePerHour: "",
      budget: Number(budget),
      chain: selectedChain ? selectedChain.value : "",
      currency: selectedCurrency ? selectedCurrency.value : "",
      skills: selectedSkills,
      walletAddress,
      city: companyData?.city,
      country: companyData?.country,
      companyName: companyData?.designation,
      imageUrl: companyData?.image_url,
      jobType: jobType ? jobType.value : "",
      projectType: projectType ? projectType.value : "",
      talent: true,
      recruiter,
      mentor,
      id,
    };

    const jobSaveUrl = id
      ? "/api/companies/update-job"
      : "/api/companies/create-job";

    const jobResponse = await fetch(jobSaveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    const savedJobData = await jobResponse.json();

    if (!jobResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      if (id) {
        toast.success("Job Offer Saved!");
        router.push(`/companies/${walletAddress}`);
      } else {
        toast.success("Job Offer Created! Now add some funds to it.");
        router.push(
          `/companies/create-job?id=${savedJobData.jobId}&addFunds=true`
        );
      }
    }
  };

  const onJobServicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJobServices({
      ...jobServices,
      [event.target.name]: event.target.checked,
    });
  };

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/companies/my-profile?walletAddress=${walletAddress}`
      );
      const data = await response.json();
      setCompanyData(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const fetchJobData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/companies/job-data?id=${id}`);
      const data = await response.json();
      setJobData(data);
      setJobServices({
        talent: true,
        recruiter: data.recruiter === "true" || false,
        mentor: data.mentor === "true" || false,
      });
      setSelectedSkills(data.skills);
      setBudget(data.budget);
      setSelectedChain(
        chains[chains.findIndex((chain) => chain.value === data.chain)]
      );
      setSelectedCurrency(
        data.chain === "ethereum"
          ? ethereumTokens[
              ethereumTokens.findIndex((token) => token.value === data.currency)
            ]
          : data.chain === "polygon"
          ? polygonTestnetTokens[
              polygonTestnetTokens.findIndex(
                (token) => token.value === data.currency
              )
            ]
          : data.chain === "gnosis-chain"
          ? gnosisChainTokens[
              gnosisChainTokens.findIndex(
                (token) => token.value === data.currency
              )
            ]
          : null
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchCompanyData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (id) {
      fetchJobData();
    }
    if (id && addFunds === "true") {
      handlePopupModal("addFunds");
    }
  }, [id, addFunds]);

  if (!walletAddress) {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 To get started, please connect your wallet. This will enable you to
        create your company profile and create jobs.
      </h3>
    );
  }

  if (walletAddress && companyData && !companyData?.designation) {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 Complete your company profile first before creating a job.
      </h3>
    );
  }

  if (companyData && companyData?.status === "pending") {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 Your company profile is under review. You will be able to create jobs
        once it is approved.
      </h3>
    );
  }

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <main className="container mx-auto">
      <h1 className="my-2 text-2xl border-b-[1px] border-slate-300 ">
        Create Job
      </h1>
      {!!id && jobData && (
        <div className="w-full mb-1 flex justify-end">
          <h3 className="font-bold">
            Provision Amount: {provisionalAmount} MATIC
          </h3>
        </div>
      )}
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-full">
            <div className="flex flex-col gap-4 mt-10">
              <div className="flex-1">
                <label
                  htmlFor="title"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Job Header*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Job Header..."
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                  defaultValue={jobData?.title}
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
                        (type) => type.value === jobData?.typeEngagement
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
                      jobTypes.findIndex(
                        (type) => type.value === jobData?.jobType
                      )
                    ]
                  }
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="inline-block mt-4 ml-3 text-base text-black form-label"
              ></label>
            </div>
            <div>
              <textarea
                name="description"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Project Description"
                maxLength={255}
                rows={5}
                defaultValue={jobData?.description}
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
                                selectedSkills.filter((_, i) => i !== index)
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

            {/* Add three checkbox here which are Talent, Recruiter and Mentor and aslo match up the styles we are having here. And add a i circular button in the right side of every checkbox lebel and if hover over it should show text just like tooltip */}
            <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:flex-wrap sm:gap-5">
              {createJobServices.map((service) => {
                const { label, value, tooltip } = service;
                const isChecked =
                  jobData?.[value] === "true" || value === "talent" || false;
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
                        (type) => type.value === jobData?.duration
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
                        (type) => type.value === jobData?.projectType
                      )
                    ]
                  }
                />
              </div>
              {projectType || jobData?.projectType ? (
                <div className="flex-1">
                  <label
                    htmlFor="budget"
                    className="inline-block ml-3 text-base text-black form-label"
                  >
                    {projectType && projectType.value === "fixed"
                      ? "Budget*"
                      : "Expected Hourly Rate*"}
                  </label>
                  <input
                    className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                    type="number"
                    name="budget"
                    onChange={onBudgetChange}
                    required
                    value={budget}
                    maxLength={100}
                    defaultValue={jobData?.budget}
                  />
                </div>
              ) : null}
            </div>
            {jobData?.budget || budget ? (
              <p className="mt-2 text-right">
                {projectType && projectType.value === "hourly"
                  ? "Total fees per hour:"
                  : "Total fees:"}{" "}
                {totalFees} USD
              </p>
            ) : null}
            <div className="flex gap-4 mt-3"></div>
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
                      ? polygonTestnetTokens
                      : selectedChain?.value === "gnosis-chain"
                      ? gnosisChainTokens
                      : []
                  }
                  defaultValue={
                    polygonTestnetTokens[
                      polygonTestnetTokens.findIndex(
                        (token) => token.value === jobData?.currency
                      )
                    ]
                  }
                />
              </div>
            </div>

            <div className="mt-12 mb-8 w-full flex justify-end gap-4 text-right">
              {!!id && (
                <Tooltip content="Provisioning funds boost swift community response to your job offer.">
                  <button
                    className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
                    type="button"
                    onClick={onManageFundsClick}
                  >
                    Manage Funds
                  </button>
                </Tooltip>
              )}
              {!!id && (
                <button
                  className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
                  type="button"
                  onClick={handleCancelJob}
                >
                  Cancel Job
                </button>
              )}

              {isLoading ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                  type="submit"
                  disabled
                >
                  Saving...
                </button>
              ) : (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
      <Modal
        open={isManageFundsModalOpen}
        onClose={handleManageFundsModalClose}
      >
        <div className="flex justify-between p-5 min-w-[300px]">
          <h3 className="text-2xl font-semibold text-black">Manage Funds:</h3>
          <button
            type="button"
            onClick={handleManageFundsModalClose}
            className="w-6 h-6 text-black bg-gray-400 rounded-full"
          >
            &#10005;
          </button>
        </div>
        <p className="px-5 mt-2 mb-3 font-base">{`Funds will primarily be allocated to cover the Protocol's Fees.`}</p>
        <div className="flex flex-col p-5 justify-center items-center">
          {!!id && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handlePopupModal("addFunds")}
            >
              Provision Funds
            </button>
          )}
          {!!id && !!jobData?.escrowAmount && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handlePopupModal("withdraw")}
            >
              Withdraw Funds
            </button>
          )}

          {!!id && !!jobData?.escrowAmount && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handlePopupModal("transfer")}
            >
              Make Payment
            </button>
          )}
        </div>
      </Modal>
      <PopupModal
        open={isPopupModalOpen}
        onClose={handlePopupModalClose}
        jobId={id}
        type={popupModalType}
        onSubmit={onPopupModalSubmit}
      />
    </main>
  );
}
