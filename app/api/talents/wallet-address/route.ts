import sql from "@/lib/db";

export async function POST(req: Request) {
  if (req.method === "POST") {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required." }), {
        status: 400,
      });
    }

    try {
      // Fetch the wallet address for the user with the given email
      const users = await sql`
        SELECT wallet_address FROM auth_users
        WHERE email = ${email}
      `;

      if (users.length === 0) {
        return new Response(
          JSON.stringify({ message: "No User Found With The Email." }),
          {
            status: 404,
          }
        );
      }

      return new Response(
        JSON.stringify({ walletAddress: users[0].wallet_address }),
        {
          status: 200,
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          message: "There was an error fetching the wallet address.",
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
