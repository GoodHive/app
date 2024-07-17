export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("walletAddress");

  if (!address) {
    return new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  return new Response(JSON.stringify({ ok: true, address: address }), {
    headers: { "Content-Type": "application/json" },
  });
}
