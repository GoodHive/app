import sql from "@/lib/db";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/auth/jwtConfig";

export async function POST(req: Request) {
  try {
    // Get session token from cookies
    const sessionToken = req.headers.get("cookie")?.split("; ")
      .find(row => row.startsWith("session_token="))
      ?.split("=")[1];
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.user_id as string;

    // Get email from request body
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Check if email already exists for another user
    const existingUser = await sql`
      SELECT userid, wallet_address FROM goodhive.users 
      WHERE LOWER(email) = ${email.toLowerCase()} 
      AND userid != ${userId}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    if (existingUser.length > 0) {
      // Email exists for another account - suggest merge
      return NextResponse.json({
        error: "Email already associated with another account",
        suggestMerge: true,
        existingAccount: {
          userid: existingUser[0].userid,
          wallet_address: existingUser[0].wallet_address,
        }
      }, { status: 409 });
    }

    // Add email to the wallet-only account
    const result = await sql`
      UPDATE goodhive.users
      SET 
        email = ${email},
        auth_method = CASE 
          WHEN wallet_address IS NOT NULL THEN 'hybrid'
          ELSE 'email'
        END,
        email_verified = FALSE,
        updated_at = NOW()
      WHERE userid = ${userId}
      RETURNING userid, email, wallet_address, auth_method
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      message: "Email added successfully",
      user: {
        user_id: result[0].userid,
        email: result[0].email,
        wallet_address: result[0].wallet_address,
        auth_method: result[0].auth_method,
      }
    });

    // Update user_email cookie
    response.cookies.set("user_email", email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Add email error:", error);
    return NextResponse.json(
      { error: "Failed to add email" },
      { status: 500 }
    );
  }
}

// Get current user's authentication methods
export async function GET(req: Request) {
  try {
    const sessionToken = req.headers.get("cookie")?.split("; ")
      .find(row => row.startsWith("session_token="))
      ?.split("=")[1];
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.user_id as string;

    const user = await sql`
      SELECT 
        userid,
        email,
        wallet_address,
        auth_method,
        merged_wallet_addresses,
        email_verified
      FROM goodhive.users
      WHERE userid = ${userId}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    if (user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        user_id: user[0].userid,
        email: user[0].email,
        wallet_address: user[0].wallet_address,
        auth_method: user[0].auth_method,
        merged_wallets: user[0].merged_wallet_addresses || [],
        email_verified: user[0].email_verified,
      }
    });

  } catch (error) {
    console.error("Get auth methods error:", error);
    return NextResponse.json(
      { error: "Failed to get authentication methods" },
      { status: 500 }
    );
  }
}