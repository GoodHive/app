import postgres from "postgres";

export async function POST(request: Request) {
  const { userId } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      UPDATE goodhive.talents
      SET approved = true, talents = true, inReview = false
      WHERE user_id = ${userId}
      `;

    await sql`
      UPDATE goodhive.users
      SET talent_status = 'approved'
      WHERE userid = ${userId}
      `;

    return new Response(
      JSON.stringify({ message: "Approved talent successfully" }),
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}