import { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
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
    return new Response(JSON.stringify({ message: "Error deleting company" }), {
      status: 500,
    });
  }
}
