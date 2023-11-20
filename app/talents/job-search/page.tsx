import { fetchJobs } from "@/lib/jobsearch";
import JobResult from "./job-result";
import { Pagination } from "@/app/components/pagination";

const itemsPerPage = 9;

export const revalidate = 0;

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: {
    items?: number;
    page: number;
    search?: string;
    location?: string;
    name?: string;
  };
}) {
  const query = { items: itemsPerPage, ...searchParams };
  const { jobs, count } = (await fetchJobs(query)) || {
    jobs: [],
    count: 0,
  };

  return (
    <div>
      <h1 className="pt-16 mx-5 text-xl font-bold">
        Search Results
        <span className="text-base font-normal">- Job Listings</span>
      </h1>

      <JobResult jobOffers={jobs} />

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={count}
        query={query}
      />
    </div>
  );
}
