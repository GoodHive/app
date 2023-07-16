"use client";
import { CompaniesCard } from "../../components/companies-card";

export default function CompaniesResult({ companie }) {
  return (
    <div className="flex flex-col min-w-full">
      <CompaniesCard
        key={companie.id}
        designation={companie.designation}
        image={companie.image_url || "/img/company_img.png"}
        website={companie.website}
        details={companie.details}
        mail={companie.email}
        phoneNumber={companie.phoneNumber}
        country={companie.country}
        city={companie.city}
        address={companie.address}
        countryFlag="/img/country_flag.png"
        telegram={companie.telegram}
        buttonText="Connect"
      />
    </div>
  );
}
