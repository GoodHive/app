"use client";

import { JobApplicationPopup } from "@/app/components/job-application-popup";
import { InlineJobBalance } from "@/app/components/JobBalance";
import "@/app/styles/rich-text.css";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

import { jobTypes, projectDuration } from "@constants/common";
import { generateJobTypeEngage } from "@utils/generate-job-type-engage";
import Cookies from "js-cookie";
import { FC, useState } from "react";
import { Button } from "./button";

interface Props {
  id: string; // UUID string
  type: string;
  title: string;
  postedBy: string;
  details: string;
  duration: string;
  image: string;
  country: string;
  countryFlag: string;
  city: string;
  typeEngagement: string;
  skills: string[];
  buttonText: string;
  budget: number;
  jobType: string;
  projectType?: string;
  companyEmail?: string;
  escrowAmount?: string;
  walletAddress: string;
  user_id?: string;
  mentor?: boolean;
  recruiter?: boolean;
  talent?: boolean;
  blockchainJobId?: string | null;
  currency?: string;
}

export const JobCard: FC<Props> = ({
  id,
  title,
  postedBy,
  details,
  duration,
  image,
  country,
  countryFlag,
  city,
  typeEngagement,
  jobType,
  skills,
  companyEmail,
  projectType,
  budget,
  walletAddress,
  escrowAmount,
  user_id,
  mentor,
  recruiter,
  talent,
  blockchainJobId,
  currency = 'USDC',
}) => {
  // Function to generate dynamic "Open to" text
  const getOpenToText = () => {
    const openToTypes = [];
    if (talent) openToTypes.push("Talents");
    if (mentor) openToTypes.push("Mentors");
    if (recruiter) openToTypes.push("Recruiters");
    
    if (openToTypes.length === 0) return null;
    if (openToTypes.length === 1) return `Open to ${openToTypes[0]}`;
    if (openToTypes.length === 2) return `Open to ${openToTypes.join(" & ")}`;
    if (openToTypes.length === 3) return `Open to ${openToTypes[0]}, ${openToTypes[1]} & ${openToTypes[2]}`;
    
    return `Open to ${openToTypes.slice(0, -1).join(", ")} & ${openToTypes[openToTypes.length - 1]}`;
  };

  const owner_userId = Cookies.get("user_id");
  const logged_in_user_id = Cookies.get("user_id");
  const typeEngagementMsg = generateJobTypeEngage(typeEngagement);
  const jobTypeMsg = jobTypes.find((job) => job.value === jobType)?.label;
  const durationMsg = projectDuration.find(
    (job) => job.value === duration,
  )?.label;
  const [isLoading, setIsLoading] = useState(false);
  const [isJobApplicationPopup, setIsJobApplicationPopup] = useState(false);

  const isOwner = owner_userId === user_id;
  // Dynamic balance display using blockchain data
  const hasBlockchainBalance = blockchainJobId && blockchainJobId !== null;


  const onApplyClickHandler = async () => {
    const userDataResponse = await fetch(
      `/api/talents/my-profile?user_id=${logged_in_user_id}`,
    );

    if (!userDataResponse.ok) {
      toast.error("You don't have a talent profile yet! Please create one.");
    }

    const userProfile = await userDataResponse.json();
    if (!userProfile.approved) {
      toast.error(
        "Only verified talent can apply for job! Please wait for your talent to be verified.",
      );
      return;
    } else {
      setIsJobApplicationPopup(true);
    }
  };

  const onJobApplicationPopupCloseHandler = () => {
    setIsJobApplicationPopup(false);
  };

  return (
    <div className="mt-11 ">
      <div className="block relative p-6 bg-blend-darken rounded-3xl box-border border-r-2 border-l-2 border-radius  bg-white shadow-[2px_7px_20px_4px_#e2e8f0]">
        <div
          className={`absolute w-32 h-40 top-5 right-7 flex flex-col items-end`}
        >
          <p className="text-base mb-2">• {jobTypeMsg}</p>
          <div className="flex gap-2">
            {id && (
              <div className="relative w-5 h-5">
                <Image
                  alt="balance"
                  src={
                    Number(escrowAmount) > 0
                      ? "/icons/money.svg"
                      : "/icons/no-money.svg"
                  }
                  fill
                />
              </div>
            )}
            <div className="flex gap-4">
              <div className="text-sm font-medium">
                {hasBlockchainBalance ? (
                  <InlineJobBalance
                    jobId={blockchainJobId}
                    currency={currency}
                  />
                ) : (
                  <span className="text-gray-500">
                    {Number(escrowAmount) > 0 ? `${escrowAmount} ${currency}` : `0 ${currency}`}
                  </span>
                )}
              </div>
              <div className="relative mt-1 h-3 w-5 mb-4">
                <Image src={countryFlag} alt="country" fill />
              </div>
            </div>
          </div>
        </div>
        <div className="pl-4 pr-5">
          <div className="flex flex-col">
            <div
              className="relative h-20 w-20 flex items-center justify-center sm:mb-6 mb-0 cursor-pointer bg-gray-100"
              style={{
                clipPath:
                  "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              }}
            >
              <Image
                className="object-cover"
                src={image || "/img/placeholder-image.png"}
                alt="profile-picture"
                fill
              />
            </div>
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                {/* Modern Country Flag Display */}
                {countryFlag && (
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200/60 shadow-sm">
                    <div className="relative w-4 h-3 rounded-sm overflow-hidden shadow-sm border border-gray-200">
                      <Image
                        src={countryFlag}
                        alt={`${country} flag`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {country}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-base text-gray-600">
                {typeEngagementMsg} - {budget} USD {projectType}
              </p>
              <p className="text-base text-gray-600">{durationMsg}</p>
              
              {/* Open to talent/mentor/recruiter status */}
              {(talent || mentor || recruiter) && (
                <div className="flex items-center gap-1.5 mb-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <p className="text-sm text-blue-600 font-medium">
                    {getOpenToText()}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 mb-5">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-base text-gray-600">
                  {city}, {country}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                Job header
              </p>
              <p className=" flex text-justify text-gray-500 font-light">
                {title}
              </p>
            </div>
            <div className="pt-2 ">
              <p className="font-bold text-base pr-1 whitespace-nowrap">
                Job description
              </p>
              <div
                className="rich-text-content text-justify text-gray-500 font-light"
                dangerouslySetInnerHTML={{ __html: details }}
              />
            </div>
            <div className="flex flex-col pt-4">
              <p className="font-bold mb-2 text-base whitespace-nowrap">
                Mandatory Skills:
              </p>
              <div className="flex flex-wrap mb-3">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 mb-2 mr-2 rounded-full bg-gray-100"
                  >
                    <span className="flex text-sm items-center">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 mb-2 flex w-full justify-end">
              {isOwner ? (
                <Link href={`/companies/create-job?id=${id}`}>
                  <Button text="Edit" type="secondary" size="small" />
                </Link>
              ) : (
                <Button
                  text="Apply Now"
                  type="primary"
                  size="small"
                  loading={isLoading}
                  onClickHandler={onApplyClickHandler}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {isJobApplicationPopup && (
        <JobApplicationPopup
          isOpen={isJobApplicationPopup}
          onClose={onJobApplicationPopupCloseHandler}
          jobTitle={title}
          companyName={postedBy}
          companyEmail={companyEmail || ""}
          jobId={id}
          walletAddress={walletAddress}
        />
      )}
    </div>
  );
};
