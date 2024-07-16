import postgres from "postgres";
import bcrypt from "bcrypt";
const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email and Password are required" }),
        {
          status: 400,
        }
      );
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      await sql`
        INSERT INTO auth_users (
          email,
          password
        ) VALUES (
          ${email},
          ${hashedPassword}
        );
      `;

      return new Response(
        JSON.stringify({ message: "User Created Successfully" }),
        {
          status: 200,
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ message: "There was an error creating your account" }),
        {
          status: 500,
        }
      );
    }
  } else {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }
}
