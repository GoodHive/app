import { BigNumberish } from "ethers";

interface Talent {
    talentId: string;
    title: string;
    jobHeadline: string;
    firstName: string;
    lastName: string;
    country: string;
    city: string;
    phoneCountryCode: number;
    phoneNumber: number;
    email: string;
    aboutWork: string;
    telegram: string;
    rate: BigNumberish;
    currency: string;
    skills: string[];
    imageUrl: string;
  }

export default Talent;