interface JobOffer {
    type: string;
    image: string;
    title: string;
    postedBy: string;
    postedOn: string;
    country: string;
    countryFlag: string;
    jobDescription: string;
    skills: string[];
    designation: string;
    companyDescription: string;
    buttonText: string;
  }

export default JobOffer;