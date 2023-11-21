"use client";

import { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const commonLinks = [
  { href: "/talents/job-search", label: "Talent" },
  { href: "/companies/search-talents", label: "Companies" },
];

const talentsLinks = [
  { href: "/talents/job-search", label: "Job Search" },
  // { href: "/talents/my-applications", label: "My Applications" },
  { href: "/talents/my-profile", label: "My Profile" },
];

const companiesLinks = [
  { href: "/companies/search-talents", label: "Search Talents" },
  { href: "/companies/job-listing", label: "Jobs Listing" },
  // { href: "/companies/create-job", label: "Create Job" },
  { href: "/companies/my-profile", label: "My Profile" },
];

export const NavBar = () => {
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);

  const pathname = usePathname();

  const links = pathname.startsWith("/talents")
    ? talentsLinks
    : pathname.startsWith("/companies")
    ? companiesLinks
    : commonLinks;

  return (
    <header aria-label="Site Header" className="bg-black ">
      <div className="flex items-center h-16 gap-8 px-8 mx-auto sm:px-6">
        <Link className="block" href="/">
          <span className="sr-only">Home</span>
          <Image
            className="block sm:hidden"
            src="/img/goodhive_light_logo.png"
            alt="GoodHive Logo"
            width={192}
            height={47}
          />
          <Image
            className="sm:block hidden"
            src="/img/goodhive_logo_icon.png"
            alt="GoodHive Logo Icon"
            width={47}
            height={47}
          />
        </Link>

        <div className="flex items-center sm:justify-end flex-1 justify-between">
          <nav aria-label="Site Nav" className="block sm:hidden">
            <ul className="flex items-center gap-6 text-sm">
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href as Route}
                    className="text-white transition hover:text-yellow-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              <ConnectButton />
            </div>

            <button
              onClick={() => setIsOpenMobileMenu(!isOpenMobileMenu)}
              className="hidden sm:block rounded bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75"
            >
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isOpenMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpenMobileMenu && (
        <div>
          <nav aria-label="Site Nav" className="hidden sm:block">
            <ul className="flex flex-col items-center justify-center gap-6 pb-3 text-sm">
              {links.map(({ href, label }) => (
                <li key={`${href}${label}`}>
                  <Link
                    href={href as Route}
                    className="text-white transition hover:text-yellow-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};
