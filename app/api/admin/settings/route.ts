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

    // Get settings from database (create settings table if needed)
    // For now, return default settings
    const settings = {
      notifications: {
        emailNotifications: true,
        approvalAlerts: true,
        weeklyReports: false,
        errorAlerts: true,
      },
      system: {
        maintenanceMode: false,
        allowRegistrations: true,
        requireEmailVerification: true,
      },
      security: {
        sessionTimeout: 30,
        maxLoginAttempts: 5,
      },
    };

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(
      JSON.stringify({ message: "Error fetching settings" }),
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await verifyAdminToken(req);
    const settings = await req.json();

    // TODO: Store settings in database
    // For now, we'll just validate and return success
    // In production, you would create a settings table and store these values

    // Validate settings structure
    if (!settings.notifications || !settings.system || !settings.security) {
      return new Response(
        JSON.stringify({ message: "Invalid settings structure" }),
        { status: 400 },
      );
    }

    // Here you would save to database:
    // await sql`
    //   INSERT INTO goodhive.admin_settings (key, value, updated_at)
    //   VALUES ('notifications', ${JSON.stringify(settings.notifications)}, NOW())
    //   ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(settings.notifications)}, updated_at = NOW()
    // `;

    return new Response(
      JSON.stringify({ message: "Settings saved successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error saving settings:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error saving settings" }), {
      status: 500,
    });
  }
}
