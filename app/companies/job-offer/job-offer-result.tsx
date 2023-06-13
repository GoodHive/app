"use client";

import { OfferCard } from "../../components/offer-card";
import JobOffer from "@interfaces/job-offer";

export default function OfferResult({ jobOffers }: { jobOffers: JobOffer[] }) {
  return (
    <div>
      {jobOffers.length > 0 && (
        // TODO: Connect job_offers table to companies table
        <OfferCard
          image="/img/company_img.png"
          title={jobOffers[0].title}
          postedBy="Company Name"
          postedOn="posted 2 days ago"
          countryFlag="/img/country_flag.png" // TODO: Implement flag table
          jobDescription={jobOffers[0].jobDescription}
          skills={jobOffers[0].skills}
          designation="Company Name"
          companyDescription="Company description : Quod opera consulta cogitabatur astute, ut hoc insidiarum genere Galli periret avunculus, ne eum ut praepotens acueret in fiduciam exitiosa coeptantem. verum navata est opera diligens hocque dilato Eusebius praepositus cubiculi missus est Cabillona aurum secum perferens, quo per turbulentos seditionum concitores occultius distributo et tumor consenuit militum et salus est in tuto locata praefecti. deinde cibo abunde perlato castra die praedicto sunt mota."
        />
      )}
    </div>
  );
}
