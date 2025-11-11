import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if user exists and get their auth method
    const users = await sql`
      SELECT auth_method, userid, email, wallet_address
      FROM goodhive.users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ authMethod: null });
    }

    return NextResponse.json({
      authMethod: users[0]?.auth_method,
      user_id: users[0]?.userid,
      email: users[0]?.email,
      wallet_address: users[0]?.wallet_address,
    });
  } catch (error) {
    console.error("Error checking account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
