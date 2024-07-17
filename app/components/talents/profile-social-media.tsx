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
  portfolio?: string;
};

export const TalentSocialMedia: FC<Props> = (props) => {
  const { linkedin, telegram, github, stackoverflow, portfolio } = props;
  const [isShowDetails, setIsShowDetails] = useState(false);

  const walletAddress = useContext(AddressContext);

  const fetchCompanyData = async () => {
    const userDataResponse = await fetch(
      `/api/companies/my-profile?walletAddress=${walletAddress}`
    );

    if (!userDataResponse.ok) {
      setIsShowDetails(false);
      return;
    }

    const userProfile = await userDataResponse.json();
    if (userProfile.status === "approved") {
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
    <div className="flex flex-col mb-10">
      <h4 className="text-[#3E3E3E] font-bold text-lg mb-5">Social Media:</h4>
      {!isShowDetails && (
        <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
          Only verified company can see talent social media!
        </p>
      )}
      {isShowDetails && (
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

          {/* {telegram && (
            <Link
              href={`https://t.me/${telegram}`}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/telegram.svg" alt="social-icon" fill />
            </Link>
          )} */}

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
      )}
    </div>
  );
};
