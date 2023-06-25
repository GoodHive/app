"use client";

import Image from "next/image";

import { FC } from "react";

import { BigNumberish } from "ethers";

import { Button } from "../components/button";

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
}) => {
  const ratePerHour = rate && currency ? `${rate}${currency}/Hour` : null;

  return (
    <div className="mt-11">
      <div className="box-border block p-6 bg-white border-l-2 border-r-2 shadow-xl bg-blend-darken shadow-gray-300 rounded-3xl border-radius">
        <div className="pl-4 pr-5">
          <div className="flex md:flex-row">
            <div
              className="relative flex items-center w-20 h-20 mx-auto mb-6 mt-7 lg:mb-0 md:mx-0"
              style={{
                clipPath:
                  "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              }}
            >
              {image && (
                <Image src={image} alt="avatar" width={157} height={166} />
              )}
            </div>
            <div className="pl-8 md:ml-2 pt-7">
              <p className="text-xl font-semibold text-gray-800">{title}</p>
              <p className="text-base text-gray-600">{postedBy}</p>
              <p className="mb-5 text-base text-gray-600">{postedOn}</p>
            </div>
            <div className="flex flex-row justify-end pt-7 grow md:ml-5">
              <div className="flex flex-col items-end">
                <Image
                  className="w-8 h-5 mt-1 mb-1"
                  src={countryFlag}
                  alt="country"
                  width={34}
                  height={23}
                />
                <div className="font-light text-gray-500">{city}</div>
              </div>
            </div>
          </div>
          <div className="flex pt-2 font-light text-gray-500">
            {description}
          </div>
          <div className="flex flex-wrap mt-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="px-3 py-1 mb-2 mr-2 rounded-full bg-amber-100"
              >
                <span className="flex items-center">{skill}</span>
              </div>
            ))}
          </div>
          <div className="flex space-between">
            <div>{ratePerHour}</div>
            {!!escrowAmount && (
              <div>
                {escrowAmount.toString()} {escrowCurrency}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <Button text="Know more..." type="secondary" size="medium" />
            <Button text="Apply Now" type="primary" size="medium" />
          </div>
        </div>
      </div>
    </div>
  );
};