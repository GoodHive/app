"use client";

import React from "react";

import JobResult from "./job-result";
import CompaniesResult from "./companies-result";
import { useEffect, useState } from "react";

export default function JobListing() {
  const [jobResultData, setJobResultData] = useState<JobResult[]>([]);
  const [companieData, setCompanieData] = useState<CompaniesResult[]>([]);
  const [jobResult, setJobResult] = useState<JobResult[]>([]);
  const [companieResult, setCompanieResult] = useState<CompaniesResult[]>([]);

  /* useEffect(() => {
    const fetchData = async () => {
      try {
        const jobResultResponse = await fetch("/api/talents/job-search");

        if (!jobResultResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const jobResult = await jobResultResponse.json();
        setJobResult(jobResult);
        console.log(jobResult);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchCompanies = async () => {
      try {
        const companies = await fetch("/api/companies/companie");

        if (!companies.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const result = await companies.json();
        console.log(result);

        setCompanieResult(result);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchCompanies();
    fetchData();
  }, []);
*/
  // Display jobs offers by company from DB in job-listing page
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobResultResponse = await fetch("/api/talents/job-search");

        if (!jobResultResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const jobResultData = await jobResultResponse.json();
        setJobResultData(jobResultData);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchCompanies = async () => {
      try {
        const companiesResponse = await fetch("/api/companies/companie");

        if (!companiesResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        const companies = await companiesResponse.json();
        setCompanieData(companies);

        const companiesWithJobs = await companieData.filter((company) =>
          jobResultData.some(
            (job) => job.wallet_address === company.wallet_address
          )
        );

        if (companiesWithJobs.length > 0) {
          const filteredJobResult = await jobResultData.filter((job) =>
            companiesWithJobs.some(
              (company) => job.wallet_address === company.wallet_address
            )
          );
          await setJobResult(filteredJobResult);
          await setCompanieResult(companiesWithJobs);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchJob();
    fetchCompanies();
  }, []);

  return (
    <main className="mx-5">
      <section>
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-row w-full md:flex-col md:w-2/6">
            {companieResult.map((company) => (
              <CompaniesResult
                key={company.wallet_address}
                companie={company}
              />
            ))}
          </div>
          <div className="box-border flex flex-col w-full p-5 mt-10 bg-white border-l-2 border-r-2 shadow-xl md:w-4/6 bg-blend-darken shadow-gray-300 rounded-3xl md:mx-2 border-radius">
            <h1 className="text-2xl font-bold">Job listing</h1>
            <div className="flex flex-col">
              {jobResult.map((job) => (
                <JobResult key={job.id} jobresult={job} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
/*const fetchCompanies = async () => {
  try {
    const companiesResponse = await fetch("/api/companies/companie");

    if (!companiesResponse.ok) {
      throw new Error("Failed to fetch data from the server");
    }
    const companies = await companiesResponse.json();
    console.log(companies);

    // Find the company with the matching wallet address
    const matchingCompany = companies.find(
      (company) => company.wallet_address === jobResult.wallet_address
    );

    // Fetch jobs based on the matching company's wallet address
    if (matchingCompany) {
      const jobsResponse = await fetch(
        `/api/jobs?wallet_address=${matchingCompany.wallet_address}`
      );
      if (!jobsResponse.ok) {
        throw new Error("Failed to fetch job data from the server");
      }
      const jobs = await jobsResponse.json();
      console.log(jobs);
      setJobResult(jobs);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};*/
