import sql from "@/lib/db";
import bcrypt from "bcryptjs";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "your-admin-secret-key";

// Verify admin token middleware
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

export async function GET() {
  try {
    await verifyAdminToken();

    const admins = await sql`
      SELECT id, name, email, created_at
      FROM goodhive.admin
      ORDER BY created_at DESC;
    `;

    return new Response(JSON.stringify({ admins }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
}

export async function POST(req: Request) {
  try {
    await verifyAdminToken();

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ message: "Name, email and password are required" }),
        {
          status: 400,
        },
      );
    }

    // Check if email already exists
    const existingAdmin = await sql`
      SELECT 1 FROM goodhive.admin WHERE email = ${email};
    `;

    if (existingAdmin.count > 0) {
      return new Response(JSON.stringify({ message: "Email already exists" }), {
        status: 409,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin
    await sql`
      INSERT INTO goodhive.admin (
        name,
        email,
        password,
        role
      ) VALUES (
        ${name},
        ${email},
        ${hashedPassword},
        'admin'
      );
    `;

    return new Response(
      JSON.stringify({ message: "Admin created successfully" }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Error creating admin" }), {
      status: 500,
    });
  }
}
