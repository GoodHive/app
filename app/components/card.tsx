"use client";

import { BigNumberish } from "ethers";
import Image from "next/image";
import Link from "next/link";

import type { FC } from "react";
import { Button } from "@components/button";

interface Props {
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  image: string;
  countryFlag: string;
  city: string;
  rate: number;
  currency: string;
  description: string;
  skills: string[];
  buttonText: string;
  escrowAmount?: BigNumberish;
  escrowCurrency?: string;
  walletAddress?: string;
}

export const Card: FC<Props> = ({
  title,
  postedBy,
  postedOn,
  image,
  countryFlag,
  city,
  description,
  skills,
  rate,
  currency = "$", // TODO: Add mapping with currencies (USD, EUR, etc.)
  escrowAmount,
  escrowCurrency = "ETH",
  walletAddress,
}) => {
  const ratePerHour = rate && currency ? `${rate}${currency}/Hour` : null;
  const croppedTitle =
    title.length > 28 ? title.substring(0, 28) + "..." : title;
  const croppedDescription =
    description.length > 100
      ? description.substring(0, 100) + "..."
      : description;
  const profileImage = image ? image : "/img/placeholder-image.png";

  return (
    <div className="box-border block p-3 mt-11 bg-white bg-blend-darken rounded-3xl shadow-[2px_7px_20px_4px_#e2e8f0]">
      <div className="px-4 sm:px-2">
        <div className="flex md:flex-row">
          <div
            className="relative flex items-center justify-center bg-yellow-300 cursor-pointer h-20 w-20 md:h-18 md:w-18 sm:h-18 sm:w-18"
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
          <div className="pt-2 pl-4 md:ml-2 sm:pl-2 sm:max-w-[130px]">
            <p className="text-lg font-semibold text-gray-800 sm:leading-tight sm:text-xs sm:mb-1">
              {croppedTitle}
            </p>
            <p className="text-base text-gray-600 sm:text-xs sm:mb-1">{postedBy}</p>
            <p className="mb-3 text-xs font-bold text-gray-600 sm:text-xs">{postedOn}</p>
          </div>
          <div className="flex flex-col items-end pt-2 grow">
            <div className="flex mb-1">
              <div className="relative w-6 mr-2 h-6">
                <Image alt="balance" src="/icons/money.svg" fill />
              </div>
              <div className="relative h-4 w-6">
                <Image src={countryFlag} alt="country" fill />
              </div>
            </div>
            <p className="font-light mb-1 text-sm text-gray-500 text-right sm:text-xs sm:max-w-[80px]">{city}</p>
            <div className="flex space-between">
              <div className="text-sm font-bold sm:text-xs">{ratePerHour}</div>
              {!!escrowAmount && (
                <div>
                  {escrowAmount?.toString()} {escrowCurrency}
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="flex pt-3 mb-3 h-16 sm:h-10 text-sm overflow-hidden text-ellipsis font-light text-[#151414]">
          {croppedDescription}
        </p>
        <div className="flex flex-wrap mb-3">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="px-2 py-1 mb-2 mr-2 rounded-full bg-amber-100"
            >
              <span className="flex text-sm items-center">{skill}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end w-full md-2 gap-3 sm:gap-1.5 sm:flex-col sm:items-center">
          <Link href={`/talents/${walletAddress}`}>
            <Button text="Know more..." type="secondary" size="small" />
          </Link>

          <Button text="Apply Now" type="primary" size="small" />
        </div>
      </div>
    </div>
  );
};
