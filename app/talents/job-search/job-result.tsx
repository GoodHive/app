"use client";

import { BigNumberish } from "ethers";

import { LittleJobCard } from "@/app/components/little-job-card";

export interface JobOffer {
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  jobDescription: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  rate: number;
  typeEngagement: string;
  currency: string;
  skills: string[];
  buttonText: string;
  escrow: BigNumberish;
}

export default function JobResult({ jobOffers }: { jobOffers: JobOffer[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobOffers.map((jobOffer, index) => (
        <LittleJobCard
          key={index}
          type="company"
          title={jobOffer.title}
          postedBy="Company Name" //TODO: connect job_offers table to companies table
          postedOn="posted 2 days ago"
          image="/img/company_img.png" //TODO: connect job_offers table to companies table
          countryFlag="/img/country_flag.png" // TODO: create flag table
          city="City" //TODO: connect job_offers table to companies table
          rate={jobOffer.rate}
          currency={jobOffer.currency}
          description={jobOffer.jobDescription}
          skills={jobOffer.skills}
          buttonText="Apply"
          // escrowAmount={jobOffer.escrowAmount} Add escrowAmount to job_offers table
          // escrowCurrency={jobOffer.escrowCurrency} Add escrowCurrency to job_offers table
        />
      ))}
    </div>
  );
}
