import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "your-admin-secret-key";

const verifyAdminToken = async (req: NextRequest) => {
  // Check Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = verify(token, ADMIN_JWT_SECRET) as { role: string };
      if (decoded.role === "admin") return decoded;
    } catch (error) {
      // Fall through to cookie check
    }
  }

  // Fallback to cookie check
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

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);

    const url = new URL(req.url);
    const targetType = url.searchParams.get("targetType");
    const targetId = url.searchParams.get("targetId");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    if (!targetType || !targetId) {
      return new Response(
        JSON.stringify({ message: "targetType and targetId are required" }),
        { status: 400 }
      );
    }

    // TODO: Create audit_log table if it doesn't exist
    // For now, return empty history or mock data
    // In production, you would query:
    // SELECT * FROM goodhive.audit_logs 
    // WHERE target_type = ${targetType} AND target_id = ${targetId}
    // ORDER BY timestamp DESC LIMIT ${limit}

    // Mock structure for now - replace with actual database query
    const history: any[] = [];

    return new Response(
      JSON.stringify({
        history,
        message: "Action history retrieved successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching action history:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error fetching action history" }),
      { status: 500 }
    );
  }
}

