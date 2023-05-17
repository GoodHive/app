import postgres from "postgres";

export async function POST(request: Request) {
  const {
    title,
    typeEmployment,
    designation,
    address,
    contractStart,
    contractEnd,
    description,
    skills,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      INSERT INTO goodhive.users_experience (
       title,
       type_employment,
       designation,
       address,
       contract_start,
       contract_end,
       description,
       skills
      ) VALUES (
        ${title},
        ${typeEmployment},
        ${designation},
        ${address},
        ${contractStart},
        ${contractEnd},
        ${description},
        ${skills}
      );
    `;

    return new Response(
      JSON.stringify({ message: "Data inserted successfully" })
    );
  } catch (error) {
    console.error("Error inserting data:", error);
    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}
