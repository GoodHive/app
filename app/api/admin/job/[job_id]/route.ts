import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { job_id: string } },
) {
  try {
    const { job_id } = params;
    const jobs = await sql`
      SELECT * FROM goodhive.job_offers WHERE id = ${job_id}
    `;

    if (jobs.length === 0) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(jobs[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { message: "Error fetching job" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { job_id: string } },
) {
  try {
    const { job_id } = params;
    const body = await request.json();
    const {
      title,
      description,
      type_engagement,
      job_type,
      project_type,
      duration,
      skills,
      budget,
      chain,
      currency,
      published,
      image_url,
    } = body;

    const updatedJob = await sql`
      UPDATE goodhive.job_offers
      SET
        title = ${title},
        description = ${description},
        type_engagement = ${type_engagement},
        job_type = ${job_type},
        project_type = ${project_type},
        duration = ${duration},
        skills = ${skills},
        budget = ${budget},
        chain = ${chain},
        currency = ${currency},
        published = ${published},
        image_url = ${image_url}
      WHERE id = ${job_id}
      RETURNING *
    `;

    if (updatedJob.length === 0) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(updatedJob[0], { status: 200 });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { message: "Error updating job" },
      { status: 500 },
    );
  }
}
