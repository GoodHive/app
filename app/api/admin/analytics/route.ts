import sql from "@/lib/db";
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

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // User growth over time (last 30 days by default)
    const userGrowth = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM goodhive.users
      WHERE created_at >= COALESCE(${startDate ? new Date(startDate) : null}, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE(${endDate ? new Date(endDate) : null}, NOW())
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Job posting trends
    const jobTrends = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM goodhive.job_offers
      WHERE created_at >= COALESCE(${startDate ? new Date(startDate) : null}, NOW() - INTERVAL '30 days')
        AND created_at <= COALESCE(${endDate ? new Date(endDate) : null}, NOW())
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Approval rates
    const approvalRates = await sql`
      SELECT 
        'talents' as type,
        COUNT(*) FILTER (WHERE approved = true) as approved,
        COUNT(*) FILTER (WHERE approved = false) as pending,
        COUNT(*) as total
      FROM goodhive.talents
        UNION ALL
      SELECT 
        'companies' as type,
        COUNT(*) FILTER (WHERE approved = true) as approved,
        COUNT(*) FILTER (WHERE approved = false) as pending,
        COUNT(*) as total
      FROM goodhive.companies
    `;

    // User registrations by role
    const usersByRole = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE talent_status = 'approved') as talents,
        COUNT(*) FILTER (WHERE mentor_status = 'approved') as mentors,
        COUNT(*) FILTER (WHERE recruiter_status = 'approved') as recruiters
      FROM goodhive.users
    `;

    // Activity by day (last 7 days)
    const dailyActivity = await sql`
      SELECT 
        DATE(created_at) as date,
        'users' as type,
        COUNT(*) as count
      FROM goodhive.users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      UNION ALL
      SELECT 
        DATE(created_at) as date,
        'jobs' as type,
        COUNT(*) as count
      FROM goodhive.job_offers
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      UNION ALL
      SELECT 
        DATE(created_at) as date,
        'talents' as type,
        COUNT(*) as count
      FROM goodhive.talents
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      UNION ALL
      SELECT 
        DATE(created_at) as date,
        'companies' as type,
        COUNT(*) as count
      FROM goodhive.companies
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Helper function to safely format dates from PostgreSQL
    const formatDate = (date: any): string => {
      if (!date) return "";
      // If it's already a string in YYYY-MM-DD format, return it
      if (typeof date === "string") {
        return date.split("T")[0]; // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss' formats
      }
      // If it's a Date object, format it
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      // Otherwise, try to convert to Date
      try {
        return new Date(date).toISOString().split("T")[0];
      } catch {
        return String(date).split("T")[0];
      }
    };

    const analytics = {
      userGrowth: userGrowth.map((row: any) => ({
        date: formatDate(row.date),
        count: Number(row.count),
      })),
      jobTrends: jobTrends.map((row: any) => ({
        date: formatDate(row.date),
        count: Number(row.count),
      })),
      approvalRates: approvalRates.map((row: any) => ({
        type: row.type,
        approved: Number(row.approved || 0),
        pending: Number(row.pending || 0),
        total: Number(row.total || 0),
        approvalRate: row.total > 0 
          ? ((Number(row.approved || 0) / Number(row.total || 0)) * 100).toFixed(1)
            : "0",
      })),
      usersByRole: {
        talents: Number(usersByRole[0]?.talents || 0),
        mentors: Number(usersByRole[0]?.mentors || 0),
        recruiters: Number(usersByRole[0]?.recruiters || 0),
      },
      dailyActivity: dailyActivity.map((row: any) => ({
        date: formatDate(row.date),
        type: row.type,
        count: Number(row.count),
      })),
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    if (
      error instanceof Error &&
      (error.message === "No token provided" ||
        error.message === "Invalid token" ||
        error.message === "Not authorized")
    ) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return new Response(
      JSON.stringify({ message: "Error fetching analytics" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
