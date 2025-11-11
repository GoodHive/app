import sql from "@/lib/db";

export async function getAdminCompanies() {
  try {
    const companies = await sql`
      SELECT *
      FROM goodhive.companies
      `;
    return companies;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
