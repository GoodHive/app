import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Clear all session-related cookies
  cookies().set("session_token", "", {
    expires: new Date(0),
    path: "/",
  });

  cookies().set("user_id", "", {
    expires: new Date(0),
    path: "/",
  });

  cookies().set("user_email", "", {
    expires: new Date(0),
    path: "/",
  });

  cookies().set("user_address", "", {
    expires: new Date(0),
    path: "/",
  });

  cookies().set("loggedIn_user", "", {
    expires: new Date(0),
    path: "/",
  });

  return NextResponse.json({ message: "Logged out successfully" });
}
