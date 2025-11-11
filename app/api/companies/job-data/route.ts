import sql from "@/lib/db";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { id } = searchParams;

    if (!id) {
    return new Response(JSON.stringify({ message: "Missing job id" }), {
      status: 404,
    });
  }

  try {
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE id = ${id}
      `;

    if (jobsQuery.length === 0) {
      return new Response(JSON.stringify({ message: "Job not found" }), {
        status: 404,
      });
    }

    // Fetch job sections
    const sectionsQuery = await sql`
      SELECT id, heading, content, sort_order, created_at, updated_at
      FROM goodhive.job_sections
      WHERE job_id = ${id}
      ORDER BY sort_order ASC
    `;
    const singleJob = jobsQuery.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      description: item.description,
      duration: item.duration,
      rate: item.rate_per_hour,
      budget: item.budget,
      skills: item.skills.split(","),
      country: item.country,
      city: item.city,
      chain: item.chain,
      currency: item.currency,
      jobType: item.job_type,
      image_url: item.image_url,
      projectType: item.project_type,
      talent: item.talent === "true" || item.talent === true,
      recruiter: item.recruiter === "true" || item.recruiter === true,
      mentor: item.mentor === "true" || item.mentor === true,
      escrowAmount: item.escrow_amount,
      walletAddress: item.wallet_address,
      createdAt: item.posted_at,
      job_id: item.job_id,
      block_id: item.block_id,
      payment_token_address: item.payment_token_address,
      blockchain_job_id: item.blockchain_job_id,
      blockchainJobId:
        item.blockchain_job_id ?? item.block_id ?? item.job_id ?? null,
      published: item.published,
      sections: sectionsQuery.map(section => ({
        id: section.id.toString(),
        job_id: id,
        heading: section.heading,
        content: section.content,
        sort_order: section.sort_order,
        created_at: section.created_at,
        updated_at: section.updated_at,
      })),
    }));

    return new Response(JSON.stringify(singleJob[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
