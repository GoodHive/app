import { NextRequest } from "next/server";
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await verifyAdminToken();
    const { userId } = params;
    const body = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    await sql`
      UPDATE goodhive.companies
      SET 
        designation = ${body.designation || null},
        headline = ${body.headline || null},
        email = ${body.email || null},
        phone_country_code = ${body.phone_country_code || null},
        phone_number = ${body.phone_number || null},
        address = ${body.address || null},
        city = ${body.city || null},
        country = ${body.country || null},
        linkedin = ${body.linkedin || null},
        twitter = ${body.twitter || null},
        github = ${body.github || null},
        telegram = ${body.telegram || null},
        approved = ${body.approved || false}
      WHERE user_id = ${userId}
    `;

    return new Response(
      JSON.stringify({ message: "Company updated successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update company error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error updating company" }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await verifyAdminToken();
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
      });
    }

    const result = await sql`
      DELETE FROM goodhive.companies
      WHERE user_id = ${userId}
    `;

    if (result.count === 0) {
      return new Response(JSON.stringify({ message: "Company not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Company deleted successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete company error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error deleting company" }), {
      status: 500,
    });
  }
}
