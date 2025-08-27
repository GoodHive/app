import { NextResponse } from "next/server";

export function addSecurityHeaders(response: NextResponse): NextResponse {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Content Security Policy - Updated for Thirdweb authentication
  const cspDirectives = [
    "default-src 'self'",
    // Allow more flexible sources in development + Thirdweb domains
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://apis.google.com https://accounts.google.com https://*.thirdweb.com https://cdn.thirdweb.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://*.thirdweb.com https://cdn.thirdweb.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com https://*.thirdweb.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://*.thirdweb.com",
    // Allow localhost in development for connect-src and add comprehensive Thirdweb domains
    isDevelopment
      ? "connect-src 'self' http://localhost:* https://api.goodhive.io https://accounts.google.com https://explorer-api.walletconnect.com https://*.infura.io ws://localhost:* wss://relay.walletconnect.com wss://relay.walletconnect.org https://api.coingecko.com https://polygon-rpc.com https://rpc-amoy.polygon.technology https://goodhive-production.vercel.app https://*.thirdweb.com https://embedded-wallet.thirdweb.com https://pay.thirdweb.com https://rpc.thirdweb.com https://bundler.thirdweb.com"
      : "connect-src 'self' https://api.goodhive-production.vercel.app https://api.goodhive.io https://accounts.google.com https://explorer-api.walletconnect.com https://*.infura.io wss://relay.walletconnect.com wss://relay.walletconnect.org https://api.coingecko.com https://polygon-rpc.com https://rpc-amoy.polygon.technology https://goodhive-production.vercel.app https://*.thirdweb.com https://embedded-wallet.thirdweb.com https://pay.thirdweb.com https://rpc.thirdweb.com https://bundler.thirdweb.com",
    // Add comprehensive Thirdweb and auth domains to frame-src
    "frame-src 'self' https://accounts.google.com https://verify.walletconnect.com https://www.youtube.com https://www.youtube-nocookie.com https://embedded-wallet.thirdweb.com https://*.thirdweb.com https://oauth.thirdweb.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspDirectives);

  // Don't set COOP/COEP here - let Next.js config handle it
  // This prevents conflicts with popup authentication

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable strict SSL (only in production)
  if (!isDevelopment) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // Referrer Policy - More permissive for authentication flows
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy - Allow clipboard for wallet operations
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=*, clipboard-read=*, clipboard-write=*",
  );

  return response;
}
