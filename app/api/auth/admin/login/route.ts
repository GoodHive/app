import sql from "@/lib/db";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "your-admin-secret-key";

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email and password are required" }),
        {
          status: 400,
        },
      );
    }

    try {
      // Fetch the admin from the database
      const admins = await sql`
        SELECT * FROM goodhive.admin
        WHERE email = ${email}
      `;

      if (admins.length === 0) {
        return new Response(
          JSON.stringify({ message: "Invalid email or password" }),
          {
            status: 401,
          },
        );
      }

      const admin = admins[0];

      // Compare the provided password with the stored password
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ message: "Invalid email or password" }),
          {
            status: 401,
          },
        );
      }

      // Generate JWT token
      const token = sign(
        { email: admin.email, role: admin.role },
        ADMIN_JWT_SECRET,
      );

      return new Response(
        JSON.stringify({
          message: "Login Successful",
          token,
          user: {
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        }),
        {
          status: 200,
        },
      );
    } catch (error) {
      console.error("Error during admin login:", error);
      return new Response(
        JSON.stringify({ message: "There was an error logging in" }),
        {
          status: 500,
        },
      );
    }
  }

  return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
    status: 405,
  });
}
