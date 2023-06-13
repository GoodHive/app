"use client";
import React, { useState } from "react";

import { Input } from "./input";
import { IconButton } from "./icon-button";
import { usePathname } from "next/navigation";
export default function Header() {
  const [textValue, setTextValue] = useState("");

  const textHandleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value);
  };
  const pathname = usePathname();
  return (
    <main className="mx-5">
      <h1 className="my-5 font-bold text-2xl">
        {pathname === "/companies/search-talents"
          ? "Looking for Talent"
          : pathname === "/talents/job-search"
          ? "Looking for Job"
          : ""}
      </h1>
      <div className=" space-y-6 sm:w-full md:w-full lg:w-6/12 xl:w-6/12 2xl:w-6/12">
        <Input
          labelText=""
          placeholder="Try Developer Solidity, Rust, C++..."
          type="text"
          required={true}
          disabled={false}
          value={textValue}
          onChange={textHandleChange}
        />
        <Input
          labelText=""
          placeholder="Location Paris, Lodon, Remote..."
          type="text"
          required={true}
          disabled={false}
          value={textValue}
          onChange={textHandleChange}
        />
        <div className="flex space-x-11">
          <IconButton
            text={
              pathname === "/companies/search-talents"
                ? "Search Talent"
                : pathname === "/talents/job-search"
                ? "Create Profile"
                : ""
            }
            type={
              pathname === "/companies/search-talents"
                ? "primary"
                : pathname === "/talents/job-search"
                ? "secondary"
                : ""
            }
            size="large"
            image={
              pathname === "/companies/search-talents"
                ? "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
                : pathname === "/talents/job-search"
                ? "M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"
                : ""
            }
          />
          <IconButton
            text={
              pathname === "/companies/search-talents"
                ? "Create Job Work"
                : pathname === "/talents/job-search"
                ? "Search Jobs"
                : ""
            }
            type={
              pathname === "/companies/search-talents"
                ? "secondary"
                : pathname === "/talents/job-search"
                ? "primary"
                : ""
            }
            size="large"
            image={
              pathname === "/companies/search-talents"
                ? "M118.3 7.47l610.06 0c11.49,0 20.8,9.32 20.8,20.81l0 678.21 44.86 0c11.49,0 20.81,9.32 20.81,20.81l0 91.08c0,11.49 -9.32,20.81 -20.81,20.81l-741.38 0c-11.49,0 -20.8,-9.32 -20.8,-20.81l0 -91.08c0,-11.49 9.31,-20.81 20.8,-20.81l44.86 0 0 -678.21c0,-11.49 9.32,-20.81 20.8,-20.81zm105.39 298.29l91.08 0 0 91.09 -91.08 0 0 -91.09zm308.2 0l91.09 0 0 91.09 -91.09 0 0 -91.09zm-154.1 0l91.08 0 0 91.09 -91.08 0 0 -91.09zm-154.1 -150.4l91.08 0 0 91.09 -91.08 0 0 -91.09zm308.2 0l91.09 0 0 91.09 -91.09 0 0 -91.09zm-154.1 0l91.08 0 0 91.09 -91.08 0 0 -91.09zm78.75 551.13l0 -149.03 -66.42 0 0 149.03 66.42 0zm-108.03 0l0 -169.84c0,-11.48 9.32,-20.8 20.81,-20.8l108.03 0c11.48,0 20.8,9.32 20.8,20.8l0 169.84 209.4 0 0 -657.41 -568.44 0 0 657.41 209.4 0zm-275.07 41.61l0 49.48 699.78 0 0 -49.48c-233.26,0 -466.52,0 -699.78,0z"
                : pathname === "/talents/job-search"
                ? "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
                : ""
            }
          />
        </div>
      </div>
    </main>
  );
}
