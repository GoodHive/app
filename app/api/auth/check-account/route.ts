import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if user exists and get their login method
    const users = await sql`
      SELECT login_method, userid, email, wallet_address, thirdweb_wallet_address
      FROM goodhive.users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ loginMethod: null });
    }

    return NextResponse.json({
      loginMethod: users[0]?.login_method,
      user_id: users[0]?.userid,
      email: users[0]?.email,
      wallet_address: users[0]?.wallet_address,
      thirdweb_wallet_address: users[0]?.thirdweb_wallet_address,
    });
  } catch (error) {
    console.error("Error checking account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
