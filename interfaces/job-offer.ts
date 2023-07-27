interface JobOffer {
    type: string;
    image: string;
    title: string;
    postedBy: string;
    postedOn: string;
    description: string;
    duration: string;
    country: string;
    countryFlag: string;
    city: string;
    rate: number;
    typeEngement: string;
    currency: string;
    skills: string[];
    walletAddress: string;
    buttonText: string;
  }

export default JobOffer;