"use client";
import { Card } from "../../components/card";
import { useEffect, useState } from "react";

export default function JobResult() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch("/api/talents/job-search");
        const data = await response.json();
        setJobs(data);
        console.log(data);
      } catch (error) {
        console.error("Error fetching job offers:", error);
        // Handle error
      }
    }

    fetchJobs();
  }, []);

  return (
    <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-44xl:grid-cols-3">
      {jobs.map((job) => (
        <Card
          key={job.id} // Make sure to provide a unique key for each item
          type="company"
          title={job.title}
          postedBy={`by ${job.postedBy}`}
          postedOn={`posted ${job.postedOn}`}
          image={job.image}
          countryFlag={job.countryFlag}
          city={job.city}
          rate={job.rate}
          currency={job.currency}
          description={job.description}
          skills={job.skills}
          buttonText="Apply"
          escrowFee={job.escrowFee}
        />
      ))}
    </div>
  );
}
