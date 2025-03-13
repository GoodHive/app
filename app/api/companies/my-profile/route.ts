import postgres from "postgres";
import type { NextRequest } from "next/server";

export async function POST(request: Request) {
  const {
    user_id,
    headline,
    designation,
    address,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    image_url,
    walletAddress,
    linkedin,
    github,
    stackoverflow,
    twitter,
    portfolio,
    status,
    inreview,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  const fields = {
    headline,
    user_id,
    designation,
    address,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    image_url,
    linkedin,
    github,
    stackoverflow,
    twitter,
    portfolio,
    status,
    wallet_address: walletAddress,
    inreview,
  };

  if (!user_id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const filteredFields = Object.entries(fields).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  const columns = filteredFields.map(([key]) => key).join(", ");
  const values = filteredFields.map(([, value]) => value);
  const placeholders = filteredFields
    .map((_, index) => `$${index + 1}`)
    .join(", ");

  const updateSet = filteredFields
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(", ");

  const query = `
    INSERT INTO goodhive.companies (${columns})
    VALUES (${placeholders})
    ON CONFLICT (user_id)
    DO UPDATE SET ${updateSet}
  `;

  try {
    await sql.unsafe(query, values);
    return new Response(
      JSON.stringify({ message: "Data inserted successfully" }),
    );
  } catch (error) {
    console.error("Error inserting data:", error);
    return new Response(JSON.stringify({ message: "Error inserting data" }), {
      status: 500,
    });
  }
}

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { userId } = searchParams;

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!userId) {
    return new Response(
      JSON.stringify({ message: "Missing user id parameter" }),
      {
        status: 404,
      },
    );
  }

  try {
    const company = await sql`
        SELECT *
        FROM goodhive.companies
        WHERE user_id = ${userId}
      `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(company[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
