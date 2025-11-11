import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const currentTime = new Date().toISOString(); // Get current time in ISO format (UTC)
    console.log(currentTime, "currentTime...");

    await sql`
      UPDATE goodhive.talents
      SET last_active = ${currentTime}
      WHERE user_id = ${user_id}
    `;

    return new Response(
      JSON.stringify({
        message: `Last active time set successfully.`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.log(error, "Error From The API...");
    return new Response(
      JSON.stringify({ message: "There was an error setting active time." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
