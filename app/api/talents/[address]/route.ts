import { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: { address: string } }
) {
  const { address: walletAddress } = context.params;

    if (!walletAddress) {
    return new Response(
      JSON.stringify({ message: "Missing address parameter" }),
      {
        status: 404,
      }
    );
  }

  try {
    const user = await sql`
        SELECT *
        FROM goodhive.users
        WHERE wallet_address = ${walletAddress}
      `;

    if (user.length === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user[0]));
  } catch (error) {
    console.error("Error retrieving data:", error);

    return new Response(JSON.stringify({ message: "Error retrieving data" }), {
      status: 500,
    });
  }
}
