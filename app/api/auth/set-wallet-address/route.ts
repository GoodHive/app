import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { walletAddress, userId } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ message: "Wallet address required." }),
        {
          status: 400,
        }
      );
    }

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required." }), {
        status: 400,
      });
    }

    try {
      // Fetch the user from the database
      const users = await sql`
        SELECT * FROM auth_users
        WHERE id = ${userId}
      `;

      if (users.length === 0) {
        return new Response(
          JSON.stringify({ message: "No User Found With The Id." }),
          {
            status: 400,
          }
        );
      }

      // Update the wallet address for the user
      await sql`
        UPDATE auth_users
        SET wallet_address = ${walletAddress}
        WHERE id = ${userId}
      `;

      return new Response(
        JSON.stringify({ message: "Wallet address updated successfully." }),
        {
          status: 200,
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          message: "There was an error updating the wallet address.",
        }),
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
