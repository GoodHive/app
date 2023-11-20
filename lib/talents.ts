import postgres from "postgres";
import Talent from "@/interfaces/talent";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});

function contains(str: string) {
  return "%" + str.toLowerCase() + "%";
}

export async function fetchTalents({
  search = "",
  location = "",
  name = "",
  items = 9,
  page = 1,
}: {
  search?: string;
  location?: string;
  name?: string;
  items: number;
  page: number;
}) {
  try {
    const countCursor = await sql`
    SELECT COUNT(*)
    FROM goodhive.users
    WHERE
      (LOWER(title) LIKE ${contains(search)} OR LOWER(skills) LIKE ${contains(
      search
    )})
      AND
      (LOWER(city) LIKE ${contains(location)} OR LOWER(country) LIKE ${contains(
      location
    )})
    AND
      (LOWER(first_name) LIKE ${contains(
        name
      )} OR LOWER(last_name) LIKE ${contains(name)})
    `;

    const count = countCursor[0].count as number;

    const limit = Number(items);
    const offset = limit * (Number(page) - 1);

    const talentsCursor = await sql`
      SELECT *
      FROM goodhive.users
      WHERE
      (LOWER(title) LIKE ${contains(search)} OR LOWER(skills) LIKE ${contains(
      search
    )})
      AND
      (LOWER(city) LIKE ${contains(location)} OR LOWER(country) LIKE ${contains(
      location
    )})
      AND
      (LOWER(first_name) LIKE ${contains(
        name
      )} OR LOWER(last_name) LIKE ${contains(name)})
      LIMIT ${limit}
      OFFSET ${offset}
      `;

    const talents: Talent[] = talentsCursor.map((talent) => {
      return {
        title: talent.title,
        description: talent.description,
        firstName: talent.first_name,
        lastName: talent.last_name,
        country: talent.country,
        city: talent.city,
        phoneCountryCode: talent.phone_country_code,
        phoneNumber: talent.phone_number,
        email: talent.email,
        aboutWork: talent.about_work,
        telegram: talent.telegram,
        rate: talent.rate,
        currency: talent.currency,
        skills: talent.skills.split(","),
        imageUrl: talent.image_url,
        walletAddress: talent.wallet_address,
      };
    });

    return { talents, count };
  } catch (error) {
    console.log("💥", error);
    throw new Error("Failed to fetch data from the server");
  }
}
