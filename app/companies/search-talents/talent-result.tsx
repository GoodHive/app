import { useState } from "react";

import { Card } from "../../components/card";
import Talent from "@interfaces/talent";

export default function TalentResult({ talents }: { talents: Talent[] }) {
  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const talentsToDisplay = talents.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {talentsToDisplay.map((talent, index) => (
          <Card
            key={index}
            type="talent"
            title={talent.title}
            postedBy={`${talent.firstName} ${talent.lastName}`}
            postedOn="Active 2 days ago" // TODO: use real data instead when available
            image={talent.imageUrl}
            countryFlag="/img/country_flag.png" // TODO: create flag table
            city={talent.city}
            rate={talent.rate}
            currency="GHV" // TODO : modify format of {talent.currency}
            description={talent.jobHeadline}
            skills={talent.skills}
            buttonText="Connect"
          />
        ))}
      </div>
      <div className="flex justify-center mt-4">
        {talents.length > itemsPerPage && (
          <ul className="space-x-2">
            {Array(Math.ceil(talents.length / itemsPerPage))
              .fill(null)
              .map((_, i) => (
                <button key={i} onClick={() => handlePageChange(i + 1)}>
                  {i + 1}
                </button>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}