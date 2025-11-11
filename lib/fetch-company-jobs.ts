import sql from "@/lib/db";

export async function getCompanyJobs(userId: string) {
  if (!userId) {
    return [];
  }
  try {
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE user_id = ${userId}
      `;

    const jobs = jobsQuery.map((item) => ({
      id: item.id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      description: item.description,
      duration: item.duration,
      budget: item.budget,
      projectType: item.project_type,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
      chain: item.chain,
      jobType: item.job_type,
      image_url: item.image_url,
      walletAddress: item.wallet_address,
      escrowAmount: item.escrow_amount,
      mentor: item.mentor === "true" || item.mentor === true,
      recruiter: item.recruiter === "true" || item.recruiter === true,
      talent: item.talent === "true" || item.talent === true,
      postedAt: item.posted_at,
    }));

    return jobs;
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}

export async function getSingleJob(id: number | undefined) {
  if (!id) {
    return null;
  }
  try {
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE id = ${id}
      `;

    if (jobsQuery.length === 0) {
      return null;
    }
    const singleJob = jobsQuery.map((item) => ({
      id: item.id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      description: item.description,
      duration: item.duration,
      budget: item.budget,
      projectType: item.project_type,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
      chain: item.chain,
      jobType: item.job_type,
      image_url: item.image_url,
      walletAddress: item.wallet_address,
      escrowAmount: item.escrow_amount,
      user_id: item.user_id,
    }));

    return singleJob[0];
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
