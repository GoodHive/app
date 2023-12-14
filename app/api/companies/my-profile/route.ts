import postgres from "postgres";

import type { NextRequest } from "next/server";

export async function POST(request: Request) {
  const {
    headline,
    designation,
    address,
    country,
    city,
    phoneCountryCode,
    phoneNumber,
    email,
    telegram,
    imageUrl,
    walletAddress,
    linkedin,
    github,
    stackoverflow,
    portfolio,
  } = await request.json();

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  try {
    await sql`
      INSERT INTO goodhive.companies (
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
        linkedin,
        github,
        stackoverflow,
        portfolio,
        wallet_address
      ) VALUES (
        ${headline},
        ${designation},
        ${address},
        ${country},
        ${city},
        ${phoneCountryCode},
        ${phoneNumber},
        ${email},
        ${telegram},
        ${imageUrl},
        ${linkedin},
        ${github},
        ${stackoverflow},
        ${portfolio},
        ${walletAddress}
      )
      ON CONFLICT (wallet_address) DO UPDATE
      SET headline = ${headline},
          designation = ${designation},
          address = ${address},
          country = ${country},
          city = ${city},
          phone_country_code = ${phoneCountryCode},
          phone_number = ${phoneNumber},
          email = ${email},
          telegram = ${telegram},
          image_url = ${imageUrl},
          linkedin = ${linkedin},
          github = ${github},
          stackoverflow = ${stackoverflow},
          portfolio = ${portfolio},
          wallet_address = ${walletAddress};
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

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);
  
  const { walletAddress } = searchParams;

  console.log("wall address >>", walletAddress);

  const sql = postgres(process.env.DATABASE_URL || "", {
    ssl: {
      rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
    },
  });

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ message: "Missing address parameter" }),
      {
        status: 404,
      }
    );
  }

  try {
    const company = await sql`
        SELECT *
        FROM goodhive.companies
        WHERE wallet_address = ${walletAddress}
      `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    console.log("company >>", company[0]);

    return new Response(JSON.stringify(company[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
