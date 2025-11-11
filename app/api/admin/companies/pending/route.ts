import {} from "@/lib/fetch-company-data";
import { getPendingCompanies } from "@/lib/fetch-pending-company";
import { getPendingTalents } from "@/lib/fetch-talent-data";
import type { NextRequest } from "next/server";

import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const pending_companies = await getPendingCompanies();
    return new Response(JSON.stringify(pending_companies), { status: 200 });
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Error fetching company data" }),
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

    try {
    await sql`
      UPDATE goodhive.companies
      SET approved = true, inReview = false
      WHERE user_id = ${userId}
      `;

    await sql`
      UPDATE goodhive.users
      SET recruiter_status = 'approved'
      WHERE userid = ${userId}
      `;

    return new Response(
      JSON.stringify({ message: "Approved company successfully" }),
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(
      JSON.stringify({ message: "Unable to approve the company" }),
      {
        status: 500,
      },
    );
  }
}
