import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.text();
    if (!body) {
      return new Response(
        JSON.stringify({ message: "Request body is empty" }),
        {
          status: 400,
        },
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid JSON format" }), {
        status: 400,
      });
    }

    const { userId } = parsedBody;

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
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.log(error, "error..");
    return new Response(JSON.stringify({ message: "Error deleting user" }), {
      status: 500,
    });
  }
}
