import { fetchTalents } from "@/lib/talents";
import { Card } from "@/app/components/card";
import { Pagination } from "@/app/components/pagination";

const itemsPerPage = 9;

export const revalidate = 0;

export default async function SearchTalentsPage({
  searchParams,
}: {
  searchParams: {
    items?: number;
    page: number;
    search?: string;
    location?: string;
  };
}) {
  const query = { items: itemsPerPage, ...searchParams };
  const { talents, count } = (await fetchTalents(query)) || {
    talents: [],
    count: 0,
  };

  return (
    <div className="mb-12">
      <h1 className="pt-16 text-xl font-bold">
        Search Results
        <span className="text-base font-normal">- Talent Search</span>
      </h1>

      <div className="grid grid-cols-3 gap-5 md:gap-4 sm:gap-4 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
        {talents.map((talent) => (
          <Card
            key={talent.phoneNumber}
            type="talent"
            title={talent.title}
            postedBy={`${talent.firstName} ${talent.lastName}`}
            postedOn="Active 2 days ago" // TODO: use real data instead when available
            image={talent.imageUrl}
            countryFlag="/img/country_flag.png" // TODO: create flag table
            city={talent.city}
            rate={Number(talent.rate)}
            currency={talent.currency}
            description={talent.description}
            skills={talent.skills}
            buttonText="Connect"
            walletAddress={talent.walletAddress}
          />
        ))}
      </div>

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={count}
        query={query}
      />
    </div>
  );
}
