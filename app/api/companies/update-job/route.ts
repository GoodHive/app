import sql from "@/lib/db";
import { IJobSection } from "@/interfaces/job-offer";

export async function POST(request: Request) {
  const {
    id,
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

  console.log(in_saving_stage, "in_saving_stage....");

    if (!id) {
    return new Response(JSON.stringify({ message: "Job id not found" }), {
      status: 400,
    });
  }

  try {
    await sql`
        UPDATE goodhive.job_offers
        SET
            title = ${title},
            type_engagement = ${typeEngagement},
            description = ${description},
            duration = ${duration},
            budget = ${budget},
            chain = ${chain},
            currency = ${currency},
            skills = ${skills},
            city = ${city},
            country = ${country},
            company_name = ${companyName},
            image_url = ${imageUrl},
            job_type = ${jobType},
            project_type = ${projectType},
            talent = ${talent},
            recruiter = ${recruiter},
            mentor = ${mentor},
            wallet_address = ${walletAddress},
            in_saving_stage = ${in_saving_stage}
        WHERE id = ${id}
        `;

    // Update job sections if provided
    if (sections && Array.isArray(sections)) {
      // Delete existing sections
      await sql`
        DELETE FROM goodhive.job_sections
        WHERE job_id = ${id}
      `;

      // Insert new sections
      if (sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as IJobSection;
          await sql`
            INSERT INTO goodhive.job_sections (
              job_id,
              heading,
              content,
              sort_order
            ) VALUES (
              ${id},
              ${section.heading},
              ${section.content},
              ${i}
            )
          `;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Job updated successfully" }),
    );
  } catch (error) {
    console.error("Error inserting data::", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
