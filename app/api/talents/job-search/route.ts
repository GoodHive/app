import sql from "@/lib/db";

// Force the browser to always fetch the latest data from the server
export const revalidate = 0;
export async function GET() {
  
    try {
      const jobs = await sql`SELECT * FROM goodhive.job_offers`;
      const formattedJobs = jobs.map((item) => ({
        title: item.title,
        typeEngagement: item.type_engagement,
        jobDescription: item.description,
        duration: item.duration,
        rate: item.rate_per_hour,
        budget: item.budget,
        skills: item.skills.split(","),
      }));

      return new Response(JSON.stringify(formattedJobs));
    } catch (error) {
      console.error("Error fetching job offers:", error);

      return new Response(
        JSON.stringify({ message: "Error fetching job offers" }),
        {
          status: 500,
        }
      );
    }
  }

