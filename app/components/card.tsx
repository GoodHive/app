"use client";
// opengraph-image
import "@/app/styles/rich-text.css";
import Image from "next/image";
import Link from "next/link";

import { generateCountryFlag } from "@utils/generate-country-flag";
import type { FC } from "react";
import LastActiveStatus from "./LastActiveStatus";
import { OptimizedJobBalance } from "./OptimizedJobBalance";

interface Props {
  jobId?: string; // UUID string
  blockId?: number;
  uniqueId: string;
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
  escrowAmount?: boolean;
  escrowCurrency?: string;
  walletAddress?: string;
  mentor?: boolean;
  recruiter?: boolean;
  talent?: boolean;
  freelancer?: boolean;
  remote?: boolean;
  availability?: boolean;
  last_active?: Date;
}

export const Card: FC<Props> = ({
  jobId,
  blockId,
  uniqueId,
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
  currency = "",
  escrowAmount,
  walletAddress,
  mentor,
  recruiter,
  talent,
  freelancer,
  remote,
  availability,
  type,
}) => {
  console.log(
    "Card props - type:",
    type,
    "talent:",
    talent,
    "mentor:",
    mentor,
    "recruiter:",
    recruiter,
    "title:",
    title,
    "jobId:",
    jobId,
    availability,
    "availability...",
  );
  // Function to generate dynamic "Open to" text
  const getOpenToText = () => {
    const openToTypes = [];
    if (talent) openToTypes.push("Talents");
    if (mentor) openToTypes.push("Mentors");
    if (recruiter) openToTypes.push("Recruiters");
    console.log(
      "Open to types for",
      title,
      ":",
      openToTypes,
      "talent:",
      talent,
      "mentor:",
      mentor,
      "recruiter:",
      recruiter,
    );

    if (openToTypes.length === 0) return "Open to All"; // Changed from null to "Open to All"
    if (openToTypes.length === 1) return `Open to ${openToTypes[0]}`;
    if (openToTypes.length === 2) return `Open to ${openToTypes.join(" & ")}`;
    if (openToTypes.length === 3)
      return `Open to ${openToTypes[0]}, ${openToTypes[1]} & ${openToTypes[2]}`;

    return `Open to ${openToTypes.slice(0, -1).join(", ")} & ${openToTypes[openToTypes.length - 1]}`;
  };

  console.log(getOpenToText(), "getOpenToText", title, "title", jobId, "jobId");

  // Rate formatting
  // const rate =
  //   budget && currency
  //     ? `${budget}${currency}/${projectType === "fixed" ? "Fixed" : "hr"}`
  //     : null;

  // Title and description with consistent truncation
  const croppedTitle =
    title.length > 40 ? title.substring(0, 37) + "..." : title;

  // Function to strip HTML tags and crop text
  const stripHtmlAndCrop = (html: string, maxLength: number) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const croppedDescription = stripHtmlAndCrop(description, 100);
  const croppedCompanyName =
    postedBy.length > 25 ? postedBy.substring(0, 22) + "..." : postedBy;

  // Profile image
  const profileImage = image ? image : "/img/placeholder-image.png";

  // Know more link
  const knowMoreLink =
    type === "talent" ? `/talents/${uniqueId}` :
    type === "job" && jobId ? `/jobs/${jobId}` :
    type === "job" ? `#` : // Disable link if jobId is missing (shouldn't happen)
    `/companies/${uniqueId}`;

  // Flag & Escrow Icon - ensure all cards have flags
  const countryFlag = generateCountryFlag(country);
  const hasEscrow = jobId !== undefined && escrowAmount;

  // Skills - show max 3 skills for consistent sizing
  const displaySkills = skills.slice(0, 3);
  const hasMoreSkills = skills.length > 3;

  // Generate consistent badge for all job cards
  const shouldShowBadge = type === "company" || type === "job"; // Only show badges for job cards

  return (
    <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/40 rounded-2xl border border-amber-100/60 shadow-sm hover:shadow-2xl hover:border-[#FFC905]/30 transition-all duration-300 ease-in-out overflow-hidden cursor-pointer flex flex-col backdrop-blur-sm">
      {/* Honey comb pattern background accent */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full text-yellow-400 transform rotate-12"
        >
          <path d="M17.5 3.5L22 6.5v6l-4.5 3L13 12.5v-6l4.5-3z M6.5 8.5L11 11.5v6l-4.5 3L2 17.5v-6l4.5-3z" />
        </svg>
      </div>

      {/* Status Badge - Always show for job cards */}
      {shouldShowBadge && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {hasEscrow ? (
            <div className="flex items-center gap-1.5 bg-green-50/90 border border-green-200/60 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">
                Secured
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/60 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-medium text-amber-700">Open</span>
            </div>
          )}

          {/* Job Balance Display */}
          <OptimizedJobBalance
            jobId={jobId}
            blockId={blockId}
            currency={currency}
            amount={budget}
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-start gap-2 sm:gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-200 overflow-hidden ring-2 ring-amber-200 shadow-sm border border-amber-200">
              <Image
                className="object-cover w-full h-full"
                src={profileImage}
                alt="Company logo"
                width={48}
                height={48}
                sizes="(max-width: 640px) 40px, 48px"
              />
            </div>
            {/* Bee accent on company logo */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#FFC905] rounded-full flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
              🐝
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 leading-tight">
                  {croppedTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                  <Link
                    href={
                      jobId ? `/companies/${uniqueId}` : `/talents/${uniqueId}`
                    }
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-[#FFC905] transition-colors"
                  >
                    {croppedCompanyName}
                  </Link>

                  {/* Modern Country Flag Display */}
                  {countryFlag && (
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-gray-200/60 shadow-sm">
                      <div className="relative w-3 h-2 sm:w-4 sm:h-3 rounded-sm overflow-hidden shadow-sm border border-gray-200">
                        <Image
                          src={countryFlag}
                          alt={`${country} flag`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700 capitalize">
                        {country}
                      </span>
                    </div>
                  )}
                </div>

                {/* Location info */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {city || "Remote"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-3">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
            {croppedDescription ||
              "Exciting opportunity to join our team and make an impact."}
          </p>
        </div>

        {/* Skills */}
        <div className="mb-4">
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displaySkills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-200 transition-all"
                >
                  {skill}
                </span>
              ))}
              {hasMoreSkills && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow"></div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-3 border-t border-amber-200/50 mt-auto">
          <div className="flex flex-col gap-1 flex-1 min-w-0 w-full sm:w-auto">
            {type === "talent" && (
              <LastActiveStatus lastActiveTime={postedOn} />
            )}
            {(type === "company" || type === "job") && (
              <span className="text-xs text-gray-500 truncate">{postedOn}</span>
            )}

            {/* Open to status */}
            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
              {(type === "company" || type === "job") ? (
                <span className="text-blue-600 flex items-center gap-1 truncate bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-blue-200">
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span className="truncate font-medium">
                    {getOpenToText()}
                  </span>
                </span>
              ) : (
                <>
                  {freelancer && remote ? (
                    <span className="text-green-600">
                      💼 Freelancing & Remote
                    </span>
                  ) : freelancer ? (
                    <span className="text-green-600">💼 Freelancing Only</span>
                  ) : remote ? (
                    <span className="text-blue-600">🌐 Remote Only</span>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <Link
            href={type === "job" ? knowMoreLink : { pathname: knowMoreLink, query: { id: jobId } }}
            className="flex-shrink-0 sm:ml-3 w-full sm:w-auto"
          >
            <button className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#FFC905] to-[#FFD93D] hover:from-[#FF8C05] hover:to-[#FFC905] rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFC905]/50 focus:ring-offset-2 border border-[#FFC905]/20 shadow-md w-full sm:w-auto">
              <span>View Details</span>
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </Link>
        </div>

        {/* Availability indicator for talents */}
        {type === "talent" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200/50">
            <div
              className={`w-2 h-2 rounded-full ${availability ? "bg-green-400" : "bg-red-400"} shadow-sm`}
            ></div>
            <span
              className={`text-[10px] sm:text-xs font-medium ${availability ? "text-green-600" : "text-red-600"}`}
            >
              {availability ? "Available for work" : "Not available"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
