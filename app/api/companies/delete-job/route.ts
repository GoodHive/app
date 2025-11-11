import sql from "@/lib/db";

export async function POST(request: Request) {
  const { id } = await request.json();

    if (!id) {
    return new Response(JSON.stringify({ message: "Job id not found" }), {
      status: 400,
    });
  }

  try {
    // delete the job

    await sql`
        DELETE FROM goodhive.job_offers
        WHERE id = ${id}
        `;

    return new Response(
      JSON.stringify({ message: "Job updated successfully" })
    );
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
