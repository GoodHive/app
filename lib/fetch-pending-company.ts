import sql from "@/lib/db";

export async function getPendingCompanies() {
  try {
    const users = await sql`
      SELECT *
      FROM goodhive.companies
      WHERE inReview = true
      `;
    return users;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
