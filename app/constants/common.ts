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
  .NEXT_PUBLIC_GOODHIVE_POLYGON_MUMBAI_CONTRACT_ADDRESS as string;

export const GoodhiveInfuraApi = process.env
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
  "0x92ED8F6A9211F9eb0F16c83A052E75099B7bf4A5";
