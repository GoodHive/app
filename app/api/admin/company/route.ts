import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");

  try {
    const company = await sql`
      SELECT * FROM goodhive.companies WHERE user_id = ${user_id}
    `;

    if (company.length === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(company[0]), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(JSON.stringify({ message: "Error fetching company" }), {
      status: 500,
    });
  }
}
