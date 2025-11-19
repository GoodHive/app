export const imageTypes = ["image/jpeg", "image/jpg", "image/png"];

export const typeEngagements = [
  { value: "freelance", label: "Freelancing" },
  { value: "remote", label: "Employee" },
  { value: "any", label: "I don't mind" },
];

export const jobTypes = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const GoodhiveContractAddress = process.env
  .NEXT_PUBLIC_GOODHIVE_POLYGON_MAINNET_DEPLOYED_CONTRACT_ADDRESS as string;

export const GoodhiveInfuraAPILink = process.env
  .NEXT_PUBLIC_GOODHIVE_INFURA_API as string;

export const GoodhiveUsdcTokenPolygon = process.env
  .NEXT_PUBLIC_GOODHIVE_USDC_TOKEN_POLYGON as string;

export const projectDuration = [
  {
    value: "lessThanSevenDays",
    label: "Less than 7 days",
  },
  {
    value: "moreThanSevenDays",
    label: "More than 7 days",
  },
  {
    value: "moreThanOneMonth",
    label: "More than a month",
  },
  {
    value: "moreThanThreeMonths",
    label: "More than 3 months",
  },
];

export const projectTypes = [
  {
    value: "fixed",
    label: "Fixed Budget",
  },
  {
    value: "hourly",
    label: "Hourly Rated",
  },
];

type createJobServicesType = {
  label: string;
  value: "talent" | "recruiter" | "mentor";
  tooltip: string;
  feePercentage: number; // Added fee percentage
};

export const createJobServices: createJobServicesType[] = [
  {
    label: "Talent",
    value: "talent",
    tooltip: "I'm selecting my talent all by myself - 10% Fee",
    feePercentage: 10, // Added fee percentage
  },
  {
    label: "Recruiter",
    value: "recruiter",
    tooltip:
      "I want a recruiter to introduce me to a shortlist of talents - 8% Fee",
    feePercentage: 8, // Added fee percentage
  },
  {
    label: "Mentor",
    value: "mentor",
    tooltip:
      "I want a tech mentor to assess technical skills of my talent before the mission starts and will mentor the talent all along the mission - 12% Fee",
    feePercentage: 12, // Added fee percentage
  },
];

export const GoodHiveContractEmail = "contact@goodhive.io";

export const GoodhiveQuestLink = "https://zealy.io/cw/goodhive";

export const GoodHiveWalletAddress =
  "0xFE3CC6c61919cc858281eDBD6A8A541210678755";

// Currency/Token options for job creation (database-only, no web3 dependencies)
export const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "USDC", label: "USDC" },
  { value: "ETH", label: "ETH" },
];

// Token constants for job creation
export const ethereumTokens = currencyOptions;
export const polygonMainnetTokens = currencyOptions;
export const polygonAmoyTokens = [
  { value: "USDC", label: "USDC" },
  { value: "DAI", label: "DAI" },
];
export const gnosisChainTokens = currencyOptions;
