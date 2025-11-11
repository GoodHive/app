import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { user_id, email } = await req.json();

    if (!user_id || !email) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 },
      );
    }

    // Update the user with the new email
    const updatedUsers = await sql`
      UPDATE goodhive.users 
      SET email = ${email}
      WHERE userid = ${user_id}
      RETURNING *
    `;

    if (updatedUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUsers[0],
    });
  } catch (error: any) {
    console.error("Error updating user:", error);

    // Handle specific PostgreSQL errors
    if (error.code === "23505" && error.constraint_name === "users_email_key") {
      return NextResponse.json(
        {
          error:
            "This email is already associated with another account. Please use a different email address or contact support if you believe this is an error.",
        },
        { status: 409 }, // Conflict status code
      );
    }

    // Handle other database errors
    if (error.code) {
      return NextResponse.json(
        { error: "Database error occurred. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
