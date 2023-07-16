"use client";
import { JobCard } from "../../components/job-card";
import { useEffect, useState } from "react";
import JobResult from "@interfaces/job-result";

export default function JobResult({ jobresult }) {
  return (
    <div className="flex flex-col min-w-full  gap-3 ">
      <JobCard
        key={jobresult.id}
        type="Job"
        title={jobresult.title}
        postedBy={jobresult.postedBy}
        details={jobresult.jobDescription}
        duration={jobresult.duration}
        image="/img/company_img.png"
        countryFlag="/img/country_flag.png"
        city={jobresult.city}
        country={jobresult.country}
        typeEngagement={jobresult.typeEngagement}
        ratePerHour={jobresult.ratePerHour}
        skills={jobresult.skills}
        buttonText="Connect"
      />
    </div>
  );
}
