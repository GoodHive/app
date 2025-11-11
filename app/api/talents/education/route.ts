import sql from "@/lib/db";

export async function POST(request: Request) {
  const {
    school,
    degree,
    filed,
    location,
    startDate,
    endDate,
    description,
    distinction,
  } = await request.json();

    try {
    await sql`
      INSERT INTO goodhive.users_education (
        school,
        degree,
        filed,
        location,
        start_date,
        end_date,
        description,
        distinction
      ) VALUES (
        ${school},
        ${degree},
        ${filed},
        ${location},
        ${startDate},
        ${endDate},
        ${description},
        ${distinction}
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
