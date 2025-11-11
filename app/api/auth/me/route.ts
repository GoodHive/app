import { JWT_SECRET, handleAuthError } from "@/lib/auth/jwtConfig";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the session token from cookies
    const sessionToken = cookies().get("session_token")?.value;
    console.log(sessionToken, "Session Token");

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token found" },
        { status: 401 },
      );
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);

    console.log(payload, "payload");
    // Return the user data from the token
    return NextResponse.json({
      user_id: payload.user_id,
      email: payload.email,
      wallet_address: payload.wallet_address,
      auth_method: payload.auth_method || "email",
      iat: payload.iat,
      exp: payload.exp,
    });
  } catch (error) {
    console.log("error payload...", error);
    const authError = handleAuthError(error);
    console.error("Token verification error:", authError.message);

    return NextResponse.json(
      { error: authError.message, code: authError.code },
      { status: authError.statusCode },
    );
  }
}
