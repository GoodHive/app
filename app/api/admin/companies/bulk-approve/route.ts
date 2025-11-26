import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "your-admin-secret-key";

const verifyAdminToken = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, ADMIN_JWT_SECRET) as { role: string };
    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export async function POST(req: NextRequest) {
  try {
    await verifyAdminToken();
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "User IDs array is required" }),
        { status: 400 }
      );
    }

    // Approve companies in parallel
    await Promise.all(
      userIds.map(async (userId: string) => {
        // Update company approval
        await sql`
          UPDATE goodhive.companies
          SET approved = true, inReview = false
          WHERE user_id = ${userId}
        `;

        // Update user recruiter status
        await sql`
          UPDATE goodhive.users
          SET recruiter_status = 'approved'
          WHERE userid = ${userId}
        `;
      })
    );

    return new Response(
      JSON.stringify({
        message: `Successfully approved ${userIds.length} company(ies)`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk approve error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error approving companies" }),
      { status: 500 }
    );
  }
}

