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
    const { userIds, approvalTypes } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "User IDs array is required" }),
        { status: 400 }
      );
    }

    // Approve talents in parallel
    await Promise.all(
      userIds.map(async (userId: string) => {
        // Update talent approval
        await sql`
          UPDATE goodhive.talents
          SET approved = true, talent = true, inReview = false
          WHERE user_id = ${userId}
        `;

        // Update user status based on approval types
        const updates: string[] = [];
        if (approvalTypes?.talent) {
          updates.push("talent_status = 'approved'");
        }
        if (approvalTypes?.mentor) {
          updates.push("mentor_status = 'approved'");
        }
        if (approvalTypes?.recruiter) {
          updates.push("recruiter_status = 'approved'");
        }

        if (updates.length > 0) {
          await sql`
            UPDATE goodhive.users
            SET ${sql.raw(updates.join(", "))}
            WHERE userid = ${userId}
          `;
        } else {
          // Default to talent approval if no types specified
          await sql`
            UPDATE goodhive.users
            SET talent_status = 'approved'
            WHERE userid = ${userId}
          `;
        }
      })
    );

    return new Response(
      JSON.stringify({
        message: `Successfully approved ${userIds.length} talent(s)`,
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
      JSON.stringify({ message: "Error approving talents" }),
      { status: 500 }
    );
  }
}

