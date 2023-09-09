import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";

export async function GET() {
  {
    try {
      const talents = await sql`SELECT * FROM goodhive.users`;
      const formattedTalents = talents.map((item) => ({
        title: item.title,
        profileHeadline: item.profile_headline,
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
