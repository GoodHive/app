import sql from "@/lib/db";

export async function POST(request: Request) {
  const { id, escrowAmount } = await request.json();

  console.log(typeof id, typeof escrowAmount);
  console.log(id, escrowAmount);

  // Input Validation
  if (!id || typeof id !== "number") {
    // Assuming 'id' is a numeric value
    return new Response(
      JSON.stringify({ message: "Invalid or missing job id" }),
      {
        status: 400,
      },
    );
  }

  if (typeof escrowAmount !== "number") {
    // Validate escrowAmount as a number
    return new Response(JSON.stringify({ message: "Invalid escrow amount" }), {
      status: 400,
    });
  }

  try {
    await sql`
        UPDATE goodhive.job_offers
        SET
            escrow_amount = ${escrowAmount}
        WHERE job_id = ${id}
        `;

    return new Response(
      JSON.stringify({ message: "Job updated successfully" }),
    );
  } catch (error) {
    console.error("Error inserting data:", error);

    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
