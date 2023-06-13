"use client";

import { useEffect, useState } from "react";

import JobOffer from "@interfaces/job-offer";
import OfferResult from "./job-offer-result";


export default function JobSearch() {
  const [jobOffersData, setJobOffersData] = useState<JobOffer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobOffersResponse = await fetch("/api/talents/job-search");

        if (!jobOffersResponse.ok) {
          throw new Error("Failed to fetch data from the server");
        }

        const jobOffers = await jobOffersResponse.json();

        setJobOffersData(jobOffers);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="mx-5">
      <OfferResult jobOffers={jobOffersData} />
    </main>
  );
}
