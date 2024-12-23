"use client";

import Link from "next/link";
import Image from "next/image";
import React, { FC, useContext, useEffect, useState } from "react";

import { AddressContext } from "@components/context";

type Props = {
  linkedin?: string;
  telegram?: string;
  github?: string;
  stackoverflow?: string;
  twitter: string;
  portfolio?: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  streetAddress: string;
};

export const CompanySocialMediaAndContact: FC<Props> = (props) => {
  const {
    linkedin,
    telegram,
    github,
    twitter,
    stackoverflow,
    portfolio,
    email,
    phone_country_code,
    phone_number,
    streetAddress,
  } = props;
  const [isShowDetails, setIsShowDetails] = useState(false);

  const walletAddress = useContext(AddressContext);

  const fetchCompanyData = async () => {
    const userDataResponse = await fetch(
      `/api/talents/my-profile?walletAddress=${walletAddress}`,
    );

    if (!userDataResponse.ok) {
      setIsShowDetails(false);
      return;
    }

    const userProfile = await userDataResponse.json();
    if (userProfile.talent_status === "approved") {
      setIsShowDetails(true);
      return;
    } else {
      setIsShowDetails(false);
    }
  };
  useEffect(() => {
    if (walletAddress) {
      fetchCompanyData();
    }
  }, [walletAddress]);

  return (
    <>
      <div className="flex flex-col mb-10">
        <h4 className="text-[#3E3E3E] font-bold text-lg mb-5">Social Media:</h4>
        <div className="flex gap-2">
          {linkedin && (
            <Link
              href={{ pathname: linkedin }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/linkedin.svg" alt="social-icon" fill />
            </Link>
          )}
          {isShowDetails && telegram && (
            <Link
              href={`https://t.me/${telegram}`}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/telegram.svg" alt="social-icon" fill />
            </Link>
          )}
          {github && (
            <Link
              href={{ pathname: github }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/github.svg" alt="social-icon" fill />
            </Link>
          )}
          {stackoverflow && (
            <Link
              href={{ pathname: stackoverflow }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/stackoverflow.svg" alt="social-icon" fill />
            </Link>
          )}
          {twitter && (
            <Link
              href={{ pathname: twitter }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image
                src="/icons/twitter.jpg"
                alt="social-icon"
                fill
                className="rounded-full"
              />
            </Link>
          )}
          {portfolio && (
            <Link
              href={{ pathname: portfolio }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/portfolio.svg" alt="social-icon" fill />
            </Link>
          )}
        </div>
      </div>
      <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">Contact info:</h3>
      {!isShowDetails && (
        <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
          Only validated talent can access this section!
        </p>
      )}
      {isShowDetails && (
        <div>
          <div className="flex w-full justify-between mb-8">
            <h4 className="text-[#4E4E4E] text-base font-bold">Email</h4>
            <p className="text-[#4E4E4E] text-base">{email}</p>
          </div>
          <div className="flex w-full justify-between mb-8">
            <h4 className="text-[#4E4E4E] text-base font-bold">Phone</h4>
            <p className="text-[#4E4E4E] text-base">{`+${phone_country_code} ${phone_number}`}</p>
          </div>
          <div className="flex w-full justify-between mb-8">
            <h4 className="text-[#4E4E4E] text-base font-bold">Address</h4>
            <p className="text-[#4E4E4E] text-base">{streetAddress}</p>
          </div>
        </div>
      )}
    </>
  );
};
