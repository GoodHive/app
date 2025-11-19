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
    let jobsQuery;
    console.log(`Looking for job with id: ${id}`);

    // First priority: Try database id (most common case)
    jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE id = ${id}
      `;
    console.log(`Database ID search result: ${jobsQuery.length} jobs found`);

    // Second priority: Try block_id if it exists and no job found
    if (jobsQuery.length === 0) {
      try {
        jobsQuery = await sql`
          SELECT *
          FROM goodhive.job_offers
          WHERE block_id = ${id}
          `;
        console.log(`Block ID search result: ${jobsQuery.length} jobs found`);
      } catch (blockIdError) {
        console.warn("Block ID column may not exist:", blockIdError.message);
      }
    }

    // Third priority: Try other fields for backward compatibility
    if (jobsQuery.length === 0) {
      try {
        jobsQuery = await sql`
          SELECT *
          FROM goodhive.job_offers
          WHERE job_id = ${id}
          `;
        console.log(`Job ID search result: ${jobsQuery.length} jobs found`);
      } catch (jobIdError) {
        console.warn("Job ID column may not exist:", jobIdError.message);
      }
    }

    if (jobsQuery.length === 0) {
      return new Response(JSON.stringify({ message: "Job not found" }), {
        status: 404,
      });
    }

    // Fetch job sections
    let sectionsQuery = [];
    try {
      sectionsQuery = await sql`
        SELECT id, heading, content, sort_order, created_at, updated_at
        FROM goodhive.job_sections
        WHERE job_id = ${id}
        ORDER BY sort_order ASC
      `;
      console.log(`Found ${sectionsQuery.length} job sections`);
    } catch (sectionsError) {
      console.warn("Could not fetch job sections:", sectionsError.message);
      sectionsQuery = []; // Fallback to empty array
    }
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
        item.block_id ?? item.blockchain_job_id ?? item.job_id ?? null,
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
