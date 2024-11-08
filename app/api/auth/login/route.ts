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
        },
      );
    }

    try {
      // Fetch the user from the database
      const users = await sql`
        SELECT * FROM goodhive.users
        WHERE email = ${email}
      `;

      if (users.length === 0) {
        return new Response(
          JSON.stringify({ message: "Invalid email or password" }),
          {
            status: 401,
          },
        );
      }

      const user = users[0];

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, user.passwordhash);

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ message: "Invalid email or password" }),
          {
            status: 401,
          },
        );
      }

      console.log(user, "uer..");
      return new Response(
        JSON.stringify({
          message: "Login Successful",
          email: user.email,
          userId: user.id,
          wallet_address: user.wallet_address,
        }),
        {
          status: 200,
        },
      );
    } catch (error) {
      console.log(error, "Error From The API...");
      return new Response(
        JSON.stringify({ message: "There was an error logging in" }),
        {
          status: 500,
        },
      );
    }
  } else {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }
}
