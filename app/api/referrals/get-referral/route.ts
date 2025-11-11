import sql from "@/lib/db";
import { NextRequest } from "next/server";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  console.log("user_id", user_id);

  if (!user_id) {
    return new Response(
      JSON.stringify({ message: "Missing user_id parameter" }),
      {
        status: 400,
      },
    );
  }

  try {
    const referral = await sql`
      SELECT *
      FROM goodhive.referrals
      WHERE user_id = ${user_id}
    `;

    if (referral.length === 0) {
      return new Response(
        JSON.stringify({ message: "No referral found for this user" }),
        {
          status: 404,
        },
      );
    }

    return new Response(JSON.stringify(referral[0]), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching referral:", error);
    return new Response(
      JSON.stringify({ message: "Error retrieving referral data" }),
      {
        status: 500,
      },
    );
  }
}
