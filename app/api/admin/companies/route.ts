import { getAdminCompanies } from "@/lib/fetch-admin-companies";
import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  console.log("Getting Companies");

  try {
    const companies = await getAdminCompanies();
    return new Response(JSON.stringify(companies), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching companies" }),
      {
        status: 500,
      },
    );
  }
}
