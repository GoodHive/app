import sql from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "your-admin-secret-key";

// Verify admin token middleware
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

    // Get total counts
    const [usersCount] = await sql`
      SELECT COUNT(*) as count FROM goodhive.users
    `;

    const [talentsCount] = await sql`
      SELECT COUNT(*) as count FROM goodhive.talents
    `;

    const [companiesCount] = await sql`
      SELECT COUNT(*) as count FROM goodhive.companies
    `;

    const [jobsCount] = await sql`
      SELECT COUNT(*) as count FROM goodhive.job_offers
    `;

    // Get pending approvals
    const [pendingTalentsCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.talents 
      WHERE approved = false AND inreview = false
    `;

    const [pendingCompaniesCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.companies 
      WHERE approved = false AND inreview = false
    `;

    // Get approved counts
    const [approvedTalentsCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.talents 
      WHERE approved = true
    `;

    const [approvedCompaniesCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.companies 
      WHERE approved = true
    `;

    // Get published jobs
    const [publishedJobsCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.job_offers 
      WHERE published = true
    `;

    // Get recent registrations (last 7 days)
    const [recentUsersCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.users 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    // Get recent jobs (last 7 days)
    const [recentJobsCount] = await sql`
      SELECT COUNT(*) as count 
      FROM goodhive.job_offers 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    // Get users with profiles
    const [usersWithProfilesCount] = await sql`
      SELECT COUNT(DISTINCT u.userid) as count
      FROM goodhive.users u
      INNER JOIN goodhive.talents t ON t.user_id = u.userid
    `;

    // Get admins count
    const [adminsCount] = await sql`
      SELECT COUNT(*) as count FROM goodhive.admin
    `;

    const statistics = {
      overview: {
        totalUsers: Number(usersCount?.count || 0),
        totalTalents: Number(talentsCount?.count || 0),
        totalCompanies: Number(companiesCount?.count || 0),
        totalJobs: Number(jobsCount?.count || 0),
        totalAdmins: Number(adminsCount?.count || 0),
      },
      approvals: {
        pendingTalents: Number(pendingTalentsCount?.count || 0),
        pendingCompanies: Number(pendingCompaniesCount?.count || 0),
        approvedTalents: Number(approvedTalentsCount?.count || 0),
        approvedCompanies: Number(approvedCompaniesCount?.count || 0),
      },
      jobs: {
        total: Number(jobsCount?.count || 0),
        published: Number(publishedJobsCount?.count || 0),
        unpublished: Number(jobsCount?.count || 0) - Number(publishedJobsCount?.count || 0),
      },
      recent: {
        usersLast7Days: Number(recentUsersCount?.count || 0),
        jobsLast7Days: Number(recentJobsCount?.count || 0),
      },
      profiles: {
        usersWithTalentProfiles: Number(usersWithProfilesCount?.count || 0),
        usersWithoutProfiles: Number(usersCount?.count || 0) - Number(usersWithProfilesCount?.count || 0),
      },
    };

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching statistics", error: String(error) }),
      {
        status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

