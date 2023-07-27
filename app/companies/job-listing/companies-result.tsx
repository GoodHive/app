"use client";

import { useContext } from "react";
import { AddressContext } from "@/app/components/context";
import { CompaniesCard } from "../../components/companies-card";
import CompanyProfile from "@interfaces/company-profile";

export default function CompaniesResult({
  companiesProfile
}: {
  companiesProfile: CompanyProfile[];
}) {
  const walletAddress = useContext(AddressContext);

  const filteredCompanies = companiesProfile.filter(
    (companyProfile) => companyProfile.walletAddress === walletAddress
  );

  return (
    <div className="flex flex-col min-w-full">
      {filteredCompanies.map((company) => (
        <CompaniesCard
          key={company.id}
          designation={company.designation}
          image={company.imageUrl}
          website={company.website}
          details={company.details}
          mail={company.mail}
          phoneNumber={company.phoneNumber}
          country={company.country}
          city={company.city}
          address={company.address}
          countryFlag="/img/country_flag.png"
          telegram={company.telegram}
          buttonText="Connect"
        />
      ))}
      {filteredCompanies.length === 0 && (
        <p>No company found for the specified wallet address.</p>
      )}
    </div>
  );
}
