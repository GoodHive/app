import sql from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;

  if (!jobId) {
    return new Response(JSON.stringify({ message: "Missing job ID" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Fetch job data
    const jobQuery = await sql`
      SELECT jo.*, c.designation as company_name, c.image_url as company_logo,
             c.headline, c.city as company_city, c.country as company_country,
             c.email as company_email, c.linkedin, c.twitter, c.portfolio,
             c.wallet_address as company_wallet_address
      FROM goodhive.job_offers jo
      LEFT JOIN goodhive.companies c ON jo.user_id = c.user_id
      WHERE jo.id = ${jobId}
    `;

    if (jobQuery.length === 0) {
      return new Response(JSON.stringify({ message: "Job not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const jobData = jobQuery[0];

    // Fetch job sections
    const sectionsQuery = await sql`
      SELECT id, heading, content, sort_order, created_at, updated_at
      FROM goodhive.job_sections
      WHERE job_id = ${jobId}
      ORDER BY sort_order ASC
    `;

    // Fetch related jobs from same company (limit 3)
    const relatedJobsQuery = await sql`
      SELECT id, title, budget, currency, project_type, city, country, posted_at
      FROM goodhive.job_offers
      WHERE user_id = ${jobData.user_id} AND id != ${jobId} AND published = true
      ORDER BY posted_at DESC
      LIMIT 3
    `;

    // Fetch application count (if you track applications)
    const applicationCountQuery = await sql`
      SELECT COUNT(*) as application_count
      FROM goodhive.job_applications
      WHERE job_id = ${jobId}
    `.catch(() => [{ application_count: 0 }]); // Fallback if table doesn't exist

    // Format the response
    const job = {
      // Job details
      id: jobData.id,
      title: jobData.title,
      description: jobData.description,
      budget: jobData.budget,
      currency: jobData.currency,
      projectType: jobData.project_type,
      jobType: jobData.job_type,
      typeEngagement: jobData.type_engagement,
      duration: jobData.duration,
      skills: jobData.skills
        ? jobData.skills.split(",").map((s: string) => s.trim())
        : [],
      city: jobData.city,
      country: jobData.country,
      postedAt: jobData.posted_at,
      createdAt: jobData.posted_at,
      published: jobData.published,

      // Blockchain data
      blockId: jobData.block_id,
      blockchainJobId: jobData.blockchain_job_id,
      escrowAmount: jobData.escrow_amount,
      paymentTokenAddress: jobData.payment_token_address,

      // Company information
      company: {
        id: jobData.user_id,
        name: jobData.company_name || jobData.designation,
        logo: jobData.company_logo,
        headline: jobData.headline,
        city: jobData.company_city,
        country: jobData.company_country,
        email: jobData.company_email,
        linkedin: jobData.linkedin,
        twitter: jobData.twitter,
        website: jobData.portfolio || null,
        walletAddress: jobData.company_wallet_address || null,
      },

      // Job sections
      sections: sectionsQuery.map((section) => ({
        id: section.id.toString(),
        jobId: jobId,
        heading: section.heading,
        content: section.content,
        sortOrder: section.sort_order,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      })),

      // Related jobs
      relatedJobs: relatedJobsQuery.map((job) => ({
        id: job.id,
        title: job.title,
        budget: job.budget,
        currency: job.currency,
        projectType: job.project_type,
        city: job.city,
        country: job.country,
        postedAt: job.posted_at,
      })),

      // Application stats
      applicationCount: applicationCountQuery[0]?.application_count || 0,
    };

    return new Response(JSON.stringify(job), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error fetching job data:", error);
    return new Response(
      JSON.stringify({ message: "Error retrieving job data" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
