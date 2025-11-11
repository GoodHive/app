import sql from "@/lib/db";
import { getCountrySearchTerms } from "@/lib/country-mapping";

type FetchJobsProps = {
  search?: string;
  location?: string;
  name?: string;
  items: number;
  page: number;
  recruiter?: string;
  mentor?: string;
  talent?: string;
  projectType?: string;
  budgetRange?: string;
  experienceLevel?: string;
  skills?: string;
  // New "Open to" filters
  openToRecruiter?: string;
  openToTalents?: string;
  jobType?: string;
  engagement?: string;
  datePosted?: string;
  sort?: string;
};

function contains(str: string) {
  return "%" + str.toLowerCase() + "%";
}

function normalizeBooleanFilter(value: string | boolean | undefined | null) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (!normalized || normalized === "undefined" || normalized === "null") {
      return null;
    }

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return null;
}

// Force the browser to always fetch the latest data from the server
/* export const revalidate = 0; */
export async function fetchJobs({
  search = "",
  location = "",
  name = "",
  items = 9,
  page = 1,
  recruiter,
  mentor,
  talent,
  projectType = "",
  budgetRange = "",
  experienceLevel = "",
  skills = "",
  openToRecruiter,
  // New "Open to" filters
  openToTalents,
  jobType = "",
  engagement = "",
  datePosted = "",
  sort = "latest",
}: FetchJobsProps) {
  try {
    const recruiterFlag = normalizeBooleanFilter(
      recruiter?.trim() ? recruiter : openToRecruiter,
    );
    const mentorFlag = normalizeBooleanFilter(mentor);
    const talentFlag = normalizeBooleanFilter(talent);
    const openToTalentsFlag = normalizeBooleanFilter(openToTalents);

    // Build dynamic WHERE conditions
    let whereConditions = ["published = true"];
    let params: any[] = [];
    let paramIndex = 0;

    // Search in title, description, skills, and company name
    // Split multi-word queries to match all words (AND logic)
    if (search) {
      const searchTerms = search.trim().split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        const searchConditions: string[] = [];
        
        // For each search term, check if it appears in any of the searchable fields
        searchTerms.forEach((term) => {
          const termPattern = contains(term);
          const termParamIndex = ++paramIndex;
          
          // Check title, description, skills, and company name
          searchConditions.push(
            `(LOWER(title) LIKE $${termParamIndex} OR LOWER(COALESCE(description, '')) LIKE $${termParamIndex} OR LOWER(COALESCE(skills, '')) LIKE $${termParamIndex} OR LOWER(company_name) LIKE $${termParamIndex})`
          );
          params.push(termPattern);
        });
        
        // All terms must match (AND logic)
        whereConditions.push(`(${searchConditions.join(' AND ')})`);
      }
    }

    // Location search - enhanced to handle country codes and full names
    if (location) {
      const searchTerms = getCountrySearchTerms(location);
      const locationConditions: string[] = [];

      // For each search term, check both city and country fields
      searchTerms.forEach((term) => {
        const termPattern = contains(term);
        const termParamIndex = ++paramIndex;

        locationConditions.push(
          `(LOWER(city) LIKE $${termParamIndex} OR LOWER(country) LIKE $${termParamIndex})`
        );
        params.push(termPattern);
      });

      // Use OR logic: location matches if any search term matches
      whereConditions.push(`(${locationConditions.join(' OR ')})`);
    }

    // Company name search (separate from general search)
    if (name) {
      whereConditions.push(`LOWER(company_name) LIKE $${++paramIndex}`);
      params.push(contains(name));
    }

    // Recruiter filter
    if (recruiterFlag === true) {
      whereConditions.push("COALESCE(recruiter::text, 'false') = 'true'");
    }

    // Mentor filter
    if (mentorFlag === true) {
      whereConditions.push("COALESCE(mentor::text, 'false') = 'true'");
    }

    // Talent filter
    if (talentFlag === true) {
      whereConditions.push("COALESCE(talent::text, 'false') = 'true'");
    }

    // New "Open to" filters
    if (openToTalentsFlag === true) {
      whereConditions.push("COALESCE(talent::text, 'false') = 'true'");
    }

    // Project type filter
    if (projectType) {
      whereConditions.push(`project_type = $${++paramIndex}`);
      params.push(projectType);
    }

    if (jobType && jobType !== "all") {
      whereConditions.push(`job_type = $${++paramIndex}`);
      params.push(jobType);
    }

    if (engagement && engagement !== "all") {
      whereConditions.push(`type_engagement = $${++paramIndex}`);
      params.push(engagement);
    }

    if (datePosted && datePosted !== "any") {
      const intervalMap: Record<string, string> = {
        "1d": "1 day",
        "3d": "3 days",
        "7d": "7 days",
        "14d": "14 days",
        "30d": "30 days",
      };

      const interval = intervalMap[datePosted];

      if (interval) {
        whereConditions.push(`posted_at >= NOW() - INTERVAL '${interval}'`);
      }
    }

    // Budget range filter
    if (budgetRange) {
      const [minBudget, maxBudget] = budgetRange.split("-").map(Number);
      if (maxBudget) {
        whereConditions.push(
          `CAST(budget AS INTEGER) BETWEEN $${++paramIndex} AND $${++paramIndex}`,
        );
        params.push(minBudget, maxBudget);
      } else {
        whereConditions.push(`CAST(budget AS INTEGER) >= $${++paramIndex}`);
        params.push(minBudget);
      }
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(",").map((s) => s.trim());
      const skillsConditions = skillsArray.map(
        () => `LOWER(COALESCE(skills, '')) LIKE $${++paramIndex}`,
      );
      whereConditions.push(`(${skillsConditions.join(" OR ")})`);
      skillsArray.forEach((skill) => params.push(contains(skill)));
    }

    const whereClause = whereConditions.join(" AND ");

    console.log("WHERE clause:", whereClause);
    console.log("Parameters:", params);

    // Count query
    const countQuery = `SELECT COUNT(*) FROM goodhive.job_offers WHERE ${whereClause}`;
    const countJobs = await sql.unsafe(countQuery, params);
    const count = countJobs[0].count as number;

    console.log("Total count:", count);

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    let orderClause = "ORDER BY posted_at DESC NULLS LAST, id DESC";
    const normalizedSort = sort?.toLowerCase();

    if (normalizedSort === "oldest") {
      orderClause = "ORDER BY posted_at ASC NULLS LAST, id ASC";
    } else if (normalizedSort === "budget_high") {
      orderClause = "ORDER BY CAST(NULLIF(budget, '') AS INTEGER) DESC NULLS LAST, posted_at DESC";
    } else if (normalizedSort === "budget_low") {
      orderClause = "ORDER BY CAST(NULLIF(budget, '') AS INTEGER) ASC NULLS LAST, posted_at DESC";
    }

    // Main query
    const limitIndex = ++paramIndex;
    const offsetIndex = ++paramIndex;
    const jobsQuery = `SELECT * FROM goodhive.job_offers WHERE ${whereClause} ${orderClause} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const jobsResult = await sql.unsafe(jobsQuery, [...params, limit, offset]);

    console.log("Jobs found:", jobsResult.length);

    const jobs = jobsResult.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      jobDescription: item.description,
      duration: item.duration,
      budget: item.budget,
      projectType: item.project_type,
      skills: item.skills ? item.skills.split(",") : [],
      country: item.country,
      city: item.city,
      walletAddress: item.wallet_address,
      image_url: item.image_url,
      talent: item.talent === "true" || item.talent === true || item.talent === 1,
      mentor: item.mentor === "true" || item.mentor === true || item.mentor === 1,
      recruiter: item.recruiter === "true" || item.recruiter === true || item.recruiter === 1,
      escrowAmount: item.escrow_amount,
      posted_at: item.posted_at,
      in_saving_stage: item.in_saving_stage,
      published: item.published,
      block_id: item.block_id,
      currency: item.currency,
    }));

    return { jobs, count };
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}
