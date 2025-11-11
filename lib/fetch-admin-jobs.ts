import sql from "@/lib/db";

export async function getAdminJobs() {
  try {
    const jobs = await sql`
      SELECT *
      FROM goodhive.job_offers
      ORDER BY created_at DESC
      `;
    return jobs;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
