import postgres from "postgres";

export async function POST(request: Request) {
  const {
    jobHeadline,
    firstName,
    lastName,
    country,
    city,
    phoneCountryCode,
    phoneNumber,
    email,
    telegram,
    aboutWork,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      INSERT INTO goodhive.users (
        job_headline,
        first_name,
        last_name,
        country,
        city,
        phone_country_code,
        phone_number,
        email,
        telegram,
        about_work
      ) VALUES (
        ${jobHeadline},
        ${firstName},
        ${lastName},
        ${country},
        ${city},
        ${phoneCountryCode},
        ${phoneNumber},
        ${email},
        ${telegram},
        ${aboutWork}
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