import { cookies } from "next/headers";
import { SiweMessage } from "siwe";

const ALLOWED_METHODS = ["POST"];

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const { method } = request;

  if (!ALLOWED_METHODS.includes(method)) {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  try {
    const body = await request.json();
    const { message, signature } = body;

    const siweMessage = new SiweMessage(message);
    const { success, error, data } = await siweMessage.verify({
      signature,
    });

    if (!success) throw error;

    // Disable the linting rule for the following line
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { value: cookieNonceValue } = cookieStore.get("nonce");

    if (data.nonce !== cookieNonceValue)
      return new Response(JSON.stringify({ message: "Invalid nonce." }), {
        headers: { "Content-Type": "application/json" },
        status: 422,
      });

    cookieStore.set("address", data.address, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 1 month
      path: "/",
    });

    return new Response(JSON.stringify({ ok: true, address: data.address }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
