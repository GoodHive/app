import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

export async function GET() {
  {
    try {
      const companies = await sql`SELECT * FROM goodhive.companies`;
      const formattedCompanies = companies.map((item) => ({
        id: item.id,
        headline: item.headline,
        designation: item.designation,
        address: item.address,
        country: item.country,
        city: item.city,
        phoneCountryCode: item.phone_country_code,
        phoneNumber: item.phone_number,
        mail: item.email,
        details: item.details,
        telegram: item.telegram,
        walletAddress: item.wallet_address,
        imageUrl: item.image_url,
      }));
      return new Response(JSON.stringify(formattedCompanies));
    } catch (error) {
      console.error("Error fetching data:", error);
      return new Response(JSON.stringify({ message: "Error fetching data" }), {
        status: 500,
      });
    }
  }
}