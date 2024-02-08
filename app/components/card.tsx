"use client";

import { BigNumberish } from "ethers";
import Image from "next/image";
import Link from "next/link";

import type { FC } from "react";
import { Button } from "@components/button";
import { generateCountryFlag } from "@utils/generate-country-flag";

interface Props {
  jobId?: number;
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  image: string;
  country: string;
  city: string;
  budget: number;
  projectType: string;
  currency: string;
  description: string;
  skills: string[];
  buttonText: string;
  escrowAmount?: string;
  escrowCurrency?: string;
  walletAddress?: string;
  mentor?: boolean;
  recruiter?: boolean;
  freelancer?: boolean;
  remote?: boolean;
  availability?: boolean;
}

export const Card: FC<Props> = ({
  jobId,
  title,
  postedBy,
  postedOn,
  image,
  country,
  city,
  description,
  skills,
  budget,
  projectType,
  currency = "$", // TODO: Add mapping with currencies (USD, EUR, etc.)
  escrowAmount,
  walletAddress,
  mentor,
  recruiter,
  freelancer,
  remote,
  availability,
}) => {
  const rate =
    budget && currency
      ? `${budget}${currency}/${projectType === "fixed" ? "Fixed" : "H"}`
      : null;
  const croppedTitle =
    title.length > 28 ? title.substring(0, 28) + "..." : title;
  const croppedDescription =
    description.length > 100
      ? description.substring(0, 100) + "..."
      : description;
  const profileImage = image ? image : "/img/placeholder-image.png";
  const knowMoreLink = jobId
    ? `/companies/${walletAddress}`
    : `/talents/${walletAddress}`;
  const countryFlag = generateCountryFlag(country);
  const moneyIcon =
    jobId && Number(escrowAmount) > 0
      ? "/icons/money.svg"
      : "/icons/no-money.svg";
  const shortSkillList =
    skills.length > 3 ? [...skills.slice(0, 3), "..."] : skills;

  return (
    <div className="box-border block p-3 mt-11 bg-white bg-blend-darken rounded-3xl shadow-[2px_7px_20px_4px_#e2e8f0]">
      <div className="flex flex-col h-full px-4 sm:px-2">
        <div className="flex md:flex-row">
          <div
            className="shrink-0 relative flex items-center justify-center bg-yellow-300 cursor-pointer h-20 w-20 md:h-18 md:w-18 sm:h-18 sm:w-18"
            style={{
              clipPath:
                "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
            }}
          >
            <Image
              className="object-cover"
              src={profileImage}
              alt="avatar"
              fill
            />
          </div>
          <div className="shrink pt-2 pl-4 md:ml-2 sm:pl-2 sm:max-w-[130px]">
            <p className="text-lg font-semibold text-gray-800 sm:leading-tight sm:text-xs sm:mb-1">
              {croppedTitle}
            </p>
            <Link
              href={
                jobId
                  ? `/companies/${walletAddress}`
                  : `/talents/${walletAddress}`
              }
            >
              <p className="text-base text-gray-600 sm:text-xs sm:mb-1">
                {postedBy}
              </p>
            </Link>
            <p className="mb-3 text-xs font-bold text-gray-600 sm:text-xs">
              {postedOn}
            </p>
          </div>
          <div className="flex flex-col items-end pt-2 grow">
            <div className="flex mb-1">
              {jobId && (
                <div className="relative w-6 mr-2 h-6">
                  <Image alt="balance" src={moneyIcon} fill />
                </div>
              )}
              {countryFlag && (
                <div className="relative h-4 w-6">
                  <Image src={countryFlag} alt="country" fill />
                </div>
              )}
            </div>
            <p className="font-light mb-1 text-sm text-gray-500 text-right sm:text-xs sm:max-w-[80px]">
              {city}
            </p>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs font-bold">{rate}</div>
              {!jobId && availability && <p className="text-xs">🟢 Active</p>}
              {!jobId && !availability && <p className="text-xs">🔴 Inactive</p>}
            </div>
          </div>
        </div>
        <p className="flex pt-3 mb-3 text-sm font-light text-[#151414]">
          {croppedDescription}
        </p>
        <div className="flex flex-wrap mb-3">
          {shortSkillList.map((skill, index) => (
            <div
              key={index}
              className="px-2 py-1 mb-2 mr-2 rounded-full bg-amber-100"
            >
              <span className="flex text-sm items-center">{skill}</span>
            </div>
          ))}
        </div>

        <div
          className={`flex grow ${
            mentor || recruiter || freelancer
              ? "justify-between"
              : "justify-end"
          } items-end w-full md-2 gap-3 sm:gap-1.5 sm:flex-col sm:items-center`}
        >
          {jobId ? (
            <p className="text-sm text-gray-500 mb-3">
              {mentor && recruiter
                ? "Open to Mentors & Recruiters"
                : mentor
                ? "Open to Mentors"
                : recruiter
                ? "Open to Recruiters"
                : ""}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-3">
              {freelancer && remote
                ? "Freelancing & Remote"
                : freelancer
                ? "Freelancing Only"
                : remote
                ? "Remote Only"
                : ""}
            </p>
          )}

          <Link href={{ pathname: knowMoreLink, query: { id: jobId } }}>
            <Button text="Know more" type="primary" size="small" />
          </Link>
        </div>
      </div>
    </div>
  );
};
