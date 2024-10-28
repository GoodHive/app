import { fetchJobs } from "@/lib/jobsearch";
import JobResult from "./job-result";
import { Pagination } from "@/app/components/pagination";

const itemsPerPage = 9;

export const revalidate = 0;

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: any;
  // searchParams: {
  //   search?: string;
  //   location?: string;
  //   name?: string;
  //   page: number;
  //   recruiter?: string;
  //   mentor?: string;
  // };
}) {
  const query = { items: itemsPerPage, ...searchParams };
  console.log("search params job search >>>", query);
  const { jobs, count } = (await fetchJobs(query)) || {
    jobs: [],
    count: 0,
  };

  return (
    <div className="mb-12">
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
