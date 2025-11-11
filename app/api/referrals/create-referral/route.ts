import sql from "@/lib/db";

import type { NextRequest } from "next/server";
import { generateReferralCode } from "@/app/utils/generate-referral-code";

// Force the browser to always fetch the latest data from the server
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  // FIXME: use snake_case instead of camelCase
  const { user_id } = await request.json();

  if (!user_id) {
    return new Response(
      JSON.stringify({ message: "Missing user_id parameter" }),
      {
        status: 404,
      },
    );
  }

  try {
    const existing_referral = await sql`
      SELECT *
      FROM goodhive.referrals
      WHERE user_id = ${user_id}
    `;

    if (existing_referral.length > 0) {
      return new Response(
        JSON.stringify({ message: "Referral code already exists." }),
        {
          status: 500,
        },
      );
    }

    const referral_code = generateReferralCode(6);

    const created_referral = await sql`
      INSERT INTO goodhive.referrals (
        user_id,
        referral_code
      ) VALUES (
        ${user_id},
        ${referral_code}
      )
      RETURNING *
    `;

    console.log(created_referral, "created_referral");

    return new Response(JSON.stringify(created_referral[0]), {
      status: 200,
    });
  } catch (error) {
    console.error("Error creating referral:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
