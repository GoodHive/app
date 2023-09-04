import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET() {
  {
    try {
      const talents = await sql`SELECT * FROM goodhive.users`;
      const formattedTalents = talents.map((item) => ({
        talentId: item.id,
        title: item.title,
        jobHeadline: item.job_headline,
        firstName: item.first_name,
        lastName: item.last_name,
        country: item.country,
        city: item.city,
        phoneCountryCode: item.phone_country_code,
        phoneNumber: item.phone_number,
        email: item.email,
        aboutWork: item.about_work,
        telegram: item.telegram,
        rate: item.rate,
        currency: item.currency,
        skills: item.skills.split(","),
        imageUrl: item.image_url,
      }));
      return new Response(JSON.stringify(formattedTalents)); //
    } catch (error) {
      console.error("Error fetching data:", error);
      return new Response(JSON.stringify({ message: "Error fetching data" }), {
        status: 500,
      });
    }
  }
}