import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { userId } = searchParams;

  if (!userId) {
    return new Response(
      JSON.stringify({ message: "Missing userId parameter" }),
      {
        status: 400,
      },
    );
  }

  try {
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE user_id = ${userId}
    `;

    console.log(jobsQuery, "jobsQuery result...");

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
      block_id: item.block_id,
    }));

    return new Response(JSON.stringify(jobs), { status: 200 });
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    return new Response(JSON.stringify({ message: "Error retrieving jobs" }), {
      status: 500,
    });
  }
}
