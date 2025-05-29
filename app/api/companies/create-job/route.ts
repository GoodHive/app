import postgres from "postgres";

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
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const postedAt = new Date().toISOString();

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

    // Insert the job offer
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
        in_saving_stage
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
        ${in_saving_stage}
      ) RETURNING id;
    `;

    const jobId = insertResult[0]?.id;

    if (!jobId) {
      throw new Error("Failed to create job - no ID returned");
    }

    return new Response(
      JSON.stringify({
        jobId,
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
  } finally {
    await sql.end();
  }
}
