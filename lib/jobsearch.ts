import postgres from "postgres";

type FetchJobsProps = {
  search?: string;
  location?: string;
  name?: string;
  items: number;
  page: number;
};

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

function contains(str: string) {
  return "%" + str.toLowerCase() + "%";
}

// Force the browser to always fetch the latest data from the server
/* export const revalidate = 0; */
export async function fetchJobs({
  search = "",
  location = "",
  name = "",
  items = 9,
  page = 1,
}: FetchJobsProps) {
  try {
    const countJobs = await sql`
        SELECT COUNT(*)
        FROM goodhive.job_offers
        WHERE
          (LOWER(title) LIKE ${contains(
            search
          )} OR LOWER(skills) LIKE ${contains(search)})
            AND 
            (LOWER(city) LIKE ${contains(
              location
            )} OR LOWER(country) LIKE ${contains(location)})
            AND
            (LOWER(company_name) LIKE ${contains(name)})
        `;

    const count = countJobs[0].count as number;
    console.log("total jobs counts", count);

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE
      (LOWER(title) LIKE ${contains(search)} OR LOWER(skills) LIKE ${contains(
      search
    )})
      AND
      (LOWER(city) LIKE ${contains(location)} OR LOWER(country) LIKE ${contains(
      location
    )})
      AND
      (LOWER(company_name) LIKE ${contains(name)})
      LIMIT ${limit}
      OFFSET ${offset}
      `;

    const jobs = jobsQuery.map((item) => ({
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      jobDescription: item.description,
      duration: item.duration,
      rate: item.rate_per_hour,
      budget: item.budget,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
    }));

    return { jobs, count };
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}
