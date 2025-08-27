"use client";

import {
  evmRawTransaction,
  getAccount,
  getOrdersHistory,
  getPortfolio,
  useOkto,
} from "@okto_web3/react-sdk";
import { BigNumber, ethers } from "ethers";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";
import { getJobBalance } from "@/app/lib/blockchain/contracts/GoodhiveJobContract";
import { Loader } from "@components/loader";
import { chains } from "@constants/chains";
import { polygonMainnetTokens } from "@constants/token-list/polygon";
import LabelOption from "@interfaces/label-option";
import { JobForm } from "./JobForm";
import { JobModals } from "./JobModals";

// Constants
const POLYGON_CAIP2_ID = "eip155:137";

// Token Addresses on Amoy
const USDCE_TOKEN_ADDRESS =
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174" as `0x${string}`;
const AMOY_DAI_TOKEN_ADDRESS =
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" as `0x${string}`;
const AMOY_AGEUR_TOKEN_ADDRESS =
  "0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4" as `0x${string}`;
const AMOY_EURO_TOKEN_ADDRESS =
  "0x4d0B6356605e6FA95c025a6f6092ECcf0Cf4317b" as `0x${string}`;

// OLD CONTRACT ADDRESS
// const GOODHIVE_CONTRACT_ADDRESS =
//   "0x76Dd1c2dd8F868665BEE369244Ee4590857d1BD3" as `0x${string}`;

const GOODHIVE_CONTRACT_ADDRESS =
  "0x26781503b90309CFD6f63A090E49f8C526D71267" as `0x${string}`;

// Token decimals mapping
const TOKEN_DECIMALS: { [key: string]: number } = {
  [USDCE_TOKEN_ADDRESS.toLowerCase()]: 6, // USDC has 6 decimals
  [AMOY_DAI_TOKEN_ADDRESS.toLowerCase()]: 18, // DAI has 18 decimals
  [AMOY_AGEUR_TOKEN_ADDRESS.toLowerCase()]: 18, // agEUR has 18 decimals
  [AMOY_EURO_TOKEN_ADDRESS.toLowerCase()]: 18, // EURO has 18 decimals
};

// Contract ABIs
const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];
const goodhiveJobContractAbi = [
  "function createJob(uint128 jobId, uint256 amount, address token) external",
  "function checkBalance(uint128 jobId) external view returns (uint256)",
  "function getJob(uint128 jobId) external view returns (address user, uint256 amount, address token)",
];

// Function to generate a random uint128 job ID
const generateJobId = () => {
  // Generate a random number between 1 and 2^128 - 1
  // We use ethers.BigNumber to handle large numbers safely
  const maxUint128 = ethers.BigNumber.from(2).pow(128).sub(1);
  const randomBytes = ethers.utils.randomBytes(16); // 16 bytes = 128 bits
  const randomNumber = ethers.BigNumber.from(randomBytes);

  // Ensure the number is within uint128 range
  const jobId = randomNumber.mod(maxUint128);

  // Add 1 to avoid zero
  return jobId.add(1);
};

export default function CreateJob() {
  const [description, setDescription] = useState("");
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
  const [blockchainBalance, setBlockchainBalance] = useState<number>(0);
  const [jobImage, setJobImage] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [oktoJobId, setOktoJobId] = useState<string | null>(null);
  const [transactionCancelled, setTransactionCancelled] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

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
  const oktoClient = useOkto();

  // Fetch user's wallet address when component mounts
  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!oktoClient) return;

      try {
        const accounts = await getAccount(oktoClient);
        console.log(accounts, "accounts...goodhive");
        const oktoAccount = accounts.find(
          (account: any) => account.caipId === POLYGON_CAIP2_ID,
        );

        if (oktoAccount) {
          setWalletAddress(oktoAccount?.address);
        } else {
          toast.error("No wallet found for Polygon network");
        }
      } catch (error: any) {
        console.error("Error fetching user wallet:", error);
        toast.error(`Failed to fetch wallet address: ${error.message}`);
      }
    };

    fetchUserWallet();
  }, [oktoClient]);

  useEffect(() => {
    const fetchUserPortfolio = async () => {
      if (!oktoClient) return;
      const portfolio = await getPortfolio(oktoClient);
      console.log(portfolio, "portfolio...goodhive");
    };
    fetchUserPortfolio();
  }, [oktoClient]);

  const handleCancelTransaction = () => {
    setTransactionCancelled(true);
    setTransactionStatus("");
    setOktoJobId(null);
    setIsLoading(false);
    toast.success("Transaction cancelled");
  };

  const handleCreateJob = async (jobId: string, amount: string) => {
    // Generate a random uint128 job ID instead of using UUID conversion
    const contractJobId = jobId;
    console.log("Generated Job ID:", contractJobId);

    if (!oktoClient) {
      toast.error("Okto client not initialized.");
      return false;
    }

    if (!walletAddress) {
      toast.error("Wallet address not found.");
      return false;
    }

    // Reset cancellation state
    setTransactionCancelled(false);

    // Add timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => {
          reject(new Error("Operation timed out after 5 minutes"));
        },
        5 * 60 * 1000,
      ); // 5 minutes timeout
    });

    // Add cancellation promise
    const cancellationPromise = new Promise((_, reject) => {
      const checkCancellation = () => {
        if (transactionCancelled) {
          reject(new Error("Transaction cancelled by user"));
        } else {
          setTimeout(checkCancellation, 1000);
        }
      };
      checkCancellation();
    });

    try {
      return await Promise.race([
        performCreateJob(contractJobId, amount),
        timeoutPromise,
        cancellationPromise,
      ]);
    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast.error(`Transaction failed: ${error.message || "Unknown error"}`);
      setTransactionStatus("");
      setOktoJobId(null);
      return false;
    }
  };

  const performCreateJob = async (contractJobId: string, amount: string) => {
    // Determine which token to use based on selectedCurrency
    let selectedTokenAddress = USDCE_TOKEN_ADDRESS; // Default to USDC
    if (selectedCurrency?.value === "DAI") {
      selectedTokenAddress = AMOY_DAI_TOKEN_ADDRESS;
    } else if (selectedCurrency?.value === "agEUR") {
      selectedTokenAddress = AMOY_AGEUR_TOKEN_ADDRESS;
    } else if (selectedCurrency?.value === "EURO") {
      selectedTokenAddress = AMOY_EURO_TOKEN_ADDRESS;
    }

    try {
      // Get token decimals
      const tokenDecimals =
        TOKEN_DECIMALS[selectedTokenAddress.toLowerCase()] || 6;
      const parsedAmount = ethers.utils
        .parseUnits(amount, tokenDecimals)
        .toString();

      if (!parsedAmount || BigNumber.from(parsedAmount).lte(0)) {
        toast.error("Amount must be greater than 0");
        return false;
      }

      console.log({
        parsedAmount,

        contractJobId,
        tokenAddress: selectedTokenAddress,
        decimals: tokenDecimals,
        walletAddress,
      });

      // --- 1. Check allowance first ---
      const erc20Interface = new ethers.utils.Interface(erc20Abi);
      const allowanceData = erc20Interface.encodeFunctionData("allowance", [
        walletAddress,
        GOODHIVE_CONTRACT_ADDRESS,
      ]) as `0x${string}`;

      // --- 2. Approve Transaction if needed ---
      setTransactionStatus("Preparing approval transaction...");
      const approveData = erc20Interface.encodeFunctionData("approve", [
        GOODHIVE_CONTRACT_ADDRESS,
        parsedAmount,
      ]) as `0x${string}`;

      console.log(approveData, "approveData");
      const approveTxParams = {
        caip2Id: POLYGON_CAIP2_ID,
        transaction: {
          from: walletAddress as `0x${string}`,
          to: selectedTokenAddress,
          value: BigInt(0),
          data: approveData,
        },
      };

      setTransactionStatus("Sending approval transaction to Okto...");
      const approveOktoJobId = await evmRawTransaction(
        oktoClient,
        approveTxParams,
      );
      setOktoJobId(approveOktoJobId);
      setTransactionStatus(
        `Approval transaction sent (Job ID: ${approveOktoJobId}). Waiting for confirmation...`,
      );

      // Wait for approval confirmation
      let approvalConfirmed = false;
      let retries = 0;
      const maxRetries = 60; // Reduced from 200 to 60 (1 minute)
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;

      while (!approvalConfirmed && retries < maxRetries) {
        // Check if transaction was cancelled
        if (transactionCancelled) {
          throw new Error("Transaction cancelled by user");
        }

        try {
          setTransactionStatus(
            `Checking approval status... (${retries + 1}/${maxRetries})`,
          );

          const orders = await getOrdersHistory(oktoClient, {
            intentId: approveOktoJobId,
            intentType: "RAW_TRANSACTION",
          });

          // Reset consecutive errors on successful API call
          consecutiveErrors = 0;

          if (orders?.[0]?.status === "SUCCESSFUL") {
            approvalConfirmed = true;
            break;
          } else if (orders?.[0]?.status === "FAILED") {
            throw new Error(
              `Approval failed: ${orders[0]?.reason || "Unknown reason"}`,
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries++;
        } catch (error: any) {
          console.error("Error checking approval status:", error);
          consecutiveErrors++;

          // If we have too many consecutive errors, break the loop
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(
              `Failed to confirm approval after ${maxConsecutiveErrors} consecutive errors: ${error.message}`,
            );
          }

          // For API errors, continue trying but increment retries
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait longer after errors
        }
      }

      if (!approvalConfirmed) {
        throw new Error(
          `Approval transaction timed out after ${maxRetries} seconds`,
        );
      }

      // --- 3. Create Job Transaction ---
      setTransactionStatus("Preparing createJob transaction...");
      const goodhiveInterface = new ethers.utils.Interface(
        goodhiveJobContractAbi,
      );

      const createJobData = goodhiveInterface.encodeFunctionData("createJob", [
        contractJobId,
        parsedAmount,
        selectedTokenAddress,
      ]) as `0x${string}`;

      console.log(createJobData, "createJobData");
      const createJobTxParams = {
        caip2Id: POLYGON_CAIP2_ID,
        transaction: {
          from: walletAddress as `0x${string}`,
          to: GOODHIVE_CONTRACT_ADDRESS,
          value: BigInt(0),
          data: createJobData,
        },
      };

      console.log(createJobTxParams, "createJobTxParams");

      setTransactionStatus("Sending createJob transaction to Okto...");
      const createJobOktoJobId = await evmRawTransaction(
        oktoClient,
        createJobTxParams,
      );
      setOktoJobId(createJobOktoJobId);
      setTransactionStatus(
        `CreateJob transaction sent (Job ID: ${createJobOktoJobId}). Your job is being created on-chain!`,
      );

      // Store the generated job ID in your database or state if needed
      console.log(
        "Successfully created job with ID:",
        contractJobId.toString(),
      );

      return true;
    } catch (error: any) {
      throw error; // Re-throw the error to be handled by the outer function
    }
  };

  const onPopupModalSubmit = async (amount: number, type: string) => {
    console.log(jobData, "job data");
    const blockId = jobData?.block_id;

    if (!blockId) {
      toast.error("Block ID not found!");
      return;
    }

    if (type === "addFunds" && id) {
      setIsLoading(true);
      try {
        const success = await handleCreateJob(
          jobData?.block_id,
          amount.toString(),
        );
        console.log(success, "success");
        if (success) {
          toast.success("Funds added successfully!");
          window.location.reload();
        }
      } catch (error: any) {
        console.error("Error adding funds:", error);
        toast.error(`Failed to add funds: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    handlePopupModalClose();
  };

  const handleCancelJob = async () => {
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
      router.push(`/companies/my-profile`);
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

  const handlePopupModal = useCallback((type: string) => {
    handleManageFundsModalClose();
    setPopupModalType(type);
    setIsPopupModalOpen(true);
  }, []);

  const handleManageFundsModalClose = () => {
    setIsManageFundsModalOpen(false);
  };

  const handlePopupModalClose = () => {
    setIsPopupModalOpen(false);
    setPopupModalType("");
  };

  // Function to convert USDC amount to its smallest unit (6 decimals)

  const handleSaveJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    toast.loading("Saving...", { duration: 2000 });

    const dataForm = {
      userId,
      title: document.querySelector<HTMLInputElement>('input[name="title"]')
        ?.value,
      typeEngagement: typeEngagement?.value || "",
      description: description,
      duration: duration?.value || "",
      budget: budget,
      chain: selectedChain?.value || "",
      currency: selectedCurrency?.value || "",
      skills: selectedSkills,
      walletAddress: walletAddress || "",
      city: companyData?.city,
      country: companyData?.country,
      companyName: companyData?.designation,
      imageUrl: jobImage || companyData?.image_url,
      jobType: jobType?.value || "",
      projectType: projectType?.value || "",
      talent: true,
      in_saving_stage: true,
      recruiter:
        document.querySelector<HTMLInputElement>('input[name="recruiter"]')
          ?.checked || false,
      mentor:
        document.querySelector<HTMLInputElement>('input[name="mentor"]')
          ?.checked || false,
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
        router.push(`/companies/${userId}`);
      } else {
        toast.success("Job Offer Saved! Now add some funds to it.");
        router.push(
          `/companies/create-job?id=${savedJobData.jobId}&addFunds=true`,
        );
      }
    }
  };

  const fetchCompanyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/companies/my-profile?userId=${userId}`,
      );
      const data = await response.json();
      setCompanyData(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchJobData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/companies/job-data?id=${id}`);
      const data = await response.json();
      setJobData({ ...data, job_id: String(data.job_id) });
      setJobServices({
        talent: true,
        recruiter: data.recruiter === "true" || false,
        mentor: data.mentor === "true" || false,
      });
      setSelectedSkills(data.skills);
      setBudget(data.budget);
      setJobImage(data.image_url);
      setDescription(data.description || "");
      setSelectedChain(
        chains[chains.findIndex((chain) => chain.value === data.chain)] ||
          chains[0],
      );
      setSelectedCurrency(
        polygonMainnetTokens[
          polygonMainnetTokens.findIndex(
            (token) => token.value === data.currency,
          )
        ],
      );
    } catch (error) {
      console.error("Error fetching job data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    id,
    setJobServices,
    setSelectedSkills,
    setBudget,
    setJobImage,
    setDescription,
    setSelectedChain,
    setSelectedCurrency,
  ]);

  const fetchJobBalance = useCallback(async () => {
    console.log(jobData, "jobData");
    if (!id || !jobData?.id) return;

    try {
      const balance = await getJobBalance(jobData.block_id);
      setBlockchainBalance(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBlockchainBalance(0);
    }
  }, [id, jobData?.id, jobData?.block_id]);

  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    } else {
      fetchCompanyData();
    }
  }, [userId, router, fetchCompanyData]);

  useEffect(() => {
    if (id) {
      fetchJobData();
    }
    if (id && addFunds === "true") {
      handlePopupModal("addFunds");
    }
  }, [id, addFunds, fetchJobData, handlePopupModal]);

  useEffect(() => {
    if (jobData?.id) {
      console.log("fetching job balance", jobData.id);
      fetchJobBalance();
    }
  }, [jobData?.id, fetchJobBalance]);

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <AuthLayout>
      <main className="container mx-auto">
        {companyData?.message === "Company not found" && (
          <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
            🚀 Please make a company profile to create a job!
          </p>
        )}
        {!companyData?.approved &&
          companyData?.message !== "Company not found" && (
            <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
              🚀 Your company profile is not yet approved, you can't create a
              job!
            </p>
          )}
        <h1 className="my-2 text-2xl border-b-[1px] border-slate-300 ">
          Create Job
        </h1>
        {!!id && jobData && (
          <div className="w-full mb-1 flex justify-end">
            <h3 className="font-bold">
              {isNaN(blockchainBalance) ? (
                <Loader />
              ) : (
                <>
                  Balance: {blockchainBalance}{" "}
                  {selectedCurrency?.label || "USDC"}
                </>
              )}
            </h3>
          </div>
        )}
        <section>
          <JobForm
            published={jobData?.published || false}
            isLoading={isLoading}
            companyData={companyData}
            jobData={jobData}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            description={description}
            setDescription={setDescription}
            jobServices={jobServices}
            setJobServices={setJobServices}
            budget={budget}
            setBudget={setBudget}
            jobImage={jobImage}
            setJobImage={setJobImage}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            typeEngagement={typeEngagement}
            setTypeEngagement={setTypeEngagement}
            jobType={jobType}
            setJobType={setJobType}
            duration={duration}
            setDuration={setDuration}
            projectType={projectType}
            setProjectType={setProjectType}
            blockchainBalance={blockchainBalance}
            onManageFundsClick={onManageFundsClick}
            handleCancelJob={handleCancelJob}
            handleSaveJob={handleSaveJob}
          />
        </section>

        <JobModals
          isManageFundsModalOpen={isManageFundsModalOpen}
          handleManageFundsModalClose={handleManageFundsModalClose}
          handlePopupModal={handlePopupModal}
          jobData={jobData}
          isPopupModalOpen={isPopupModalOpen}
          handlePopupModalClose={handlePopupModalClose}
          popupModalType={popupModalType}
          onPopupModalSubmit={onPopupModalSubmit}
          selectedCurrency={selectedCurrency}
        />

        {transactionStatus && (
          <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-4 text-center z-50">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex-1">{transactionStatus}</div>
              <button
                onClick={handleCancelTransaction}
                className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </AuthLayout>
  );
}
