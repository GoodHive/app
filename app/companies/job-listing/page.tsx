"use client";

import { useEffect, useState } from "react";

import JobOffer from "@interfaces/job-offer";
import CompanyProfile from "@interfaces/company-profile";
import JobResult from "./job-result";
import CompaniesResult from "./companies-result";

export default function JobListing() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [companiesProfile, setCompaniesProfile] = useState<CompanyProfile[]>([]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch job offers
        const jobOffersResponse = await fetch("/api/companies/job-listing/job-offers");
        if (!jobOffersResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }

        const jobOffers = await jobOffersResponse.json();
        setJobOffers(jobOffers);

        // fetch companies
        const companiesResponse = await fetch("/api/companies/job-listing/companies-info");
        if (!companiesResponse.ok) {
          throw new Error("Failed to fetch companies from the server");
        }
        const companies = await companiesResponse.json();
        setCompaniesProfile(companies);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="mx-5">
      <section>
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-row w-full md:flex-col md:w-2/6">
            <CompaniesResult companiesProfile={companiesProfile} />
          </div>
          <div className="box-border flex flex-col w-full p-5 mt-10 bg-white border-l-2 border-r-2 shadow-xl md:w-4/6 bg-blend-darken shadow-gray-300 rounded-3xl md:mx-2 border-radius">
            <h1 className="text-2xl font-bold">Job listing</h1>
            <div className="flex flex-col">
              <JobResult jobOffers={jobOffers} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}