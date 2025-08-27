import type { NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);
  const { user_id } = searchParams;

  if (!user_id) {
    return new Response(JSON.stringify({ message: "User ID is required" }), {
      status: 400,
    });
  }

  try {
    const users = await sql`
      SELECT id, userid, email, talent_status, mentor_status, recruiter_status, wallet_address, thirdweb_wallet_address, referred_by, approved_roles
      FROM goodhive.users
      WHERE userid = ${user_id}
    `;

    return new Response(JSON.stringify({ user: users[0] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error Retriving Profile Data" }),
      {
        status: 500,
      },
    );
  }
}
