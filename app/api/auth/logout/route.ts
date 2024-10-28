import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const address = cookieStore.get("token");

  if (address.value) {
    cookies().set("address", "", {
      path: "/",
    });

    // return a response
    return new Response(null, {
      status: 200,
      statusText: "OK",
    });
  }

  return new Response(null, {
    status: 401,
    statusText: "Unauthorized",
  });
}
