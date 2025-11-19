import sql from "@/lib/db";
import { IJobSection } from "@/interfaces/job-offer";

export async function POST(request: Request) {
  const {
    userId,
    title,
    typeEngagement,
    description,
    duration,
    budget,
    skills,
    chain,
    currency,
    walletAddress,
    city,
    country,
    imageUrl,
    jobType,
    companyName,
    projectType,
    talent,
    recruiter,
    mentor,
    in_saving_stage,
    sections, // New field for job sections
  } = await request.json();

  try {
    const postedAt = new Date().toISOString();

    // Generate unique block_id for blockchain operations
    // Format: timestamp + random 6-digit number for uniqueness
    const blockId = `${Date.now()}${Math.floor(100000 + Math.random() * 900000)}`;

    // First check if user exists and is approved
    const userCheck = await sql`
      SELECT approved 
      FROM goodhive.companies 
      WHERE user_id = ${userId}
    `;

    if (userCheck.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Company not found",
          message: "Please create a company profile first",
        }),
        { status: 404 },
      );
    }

    if (!userCheck[0].approved) {
      return new Response(
        JSON.stringify({
          error: "Company not approved",
          message: "Your company profile needs to be approved first",
        }),
        { status: 403 },
      );
    }

    // Insert the job offer with block_id
    const insertResult = await sql`
      INSERT INTO goodhive.job_offers (
        user_id,
        title,
        type_engagement,
        description,
        duration,
        budget,
        chain,
        currency,
        skills,
        city,
        country,
        company_name,
        image_url,
        job_type,
        project_type,
        talent,
        recruiter,
        mentor,
        wallet_address,
        posted_at,
        in_saving_stage,
        block_id
      ) VALUES (
        ${userId},
        ${title},
        ${typeEngagement},
        ${description},
        ${duration},
        ${budget},
        ${chain},
        ${currency},
        ${skills},
        ${city},
        ${country},
        ${companyName},
        ${imageUrl},
        ${jobType},
        ${projectType},
        ${talent},
        ${recruiter},
        ${mentor},
        ${walletAddress},
        ${postedAt},
        ${in_saving_stage},
        ${blockId}
      ) RETURNING id, block_id;
    `;

    const jobId = insertResult[0]?.id;
    const jobBlockId = insertResult[0]?.block_id;

    if (!jobId || !jobBlockId) {
      throw new Error("Failed to create job - no ID returned");
    }

    // Insert job sections if provided
    if (sections && Array.isArray(sections) && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as IJobSection;
        await sql`
          INSERT INTO goodhive.job_sections (
            job_id,
            heading,
            content,
            sort_order
          ) VALUES (
            ${jobId},
            ${section.heading},
            ${section.content},
            ${i}
          )
        `;
      }
    } else if (description && description.trim()) {
      // If no sections provided but description exists, create a default section
      await sql`
        INSERT INTO goodhive.job_sections (
          job_id,
          heading,
          content,
          sort_order
        ) VALUES (
          ${jobId},
          ${"Job Description"},
          ${description},
          ${0}
        )
      `;
    }

    return new Response(
      JSON.stringify({
        jobId,
        blockId: jobBlockId,
        message: "Job created successfully",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating job:", error);

    return new Response(
      JSON.stringify({
        error: "Database error",
        message: "Failed to create job",
      }),
      { status: 500 },
    );
  }
}
