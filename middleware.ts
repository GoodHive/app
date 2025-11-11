import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_JWT_SECRET,
  JWT_SECRET,
  handleAuthError,
} from "./lib/auth/jwtConfig";
import { addSecurityHeaders } from "./lib/security/headers";
import { rateLimit } from "./middleware/rateLimit";

// Public paths that don't need authentication
const PUBLIC_PATHS = [
  "/auth/signup",
  "/admin/login",
  "/",
  "/about-us",  // Public about us page
  "/blog",  // Allow access to blog pages
  "/talents/job-search",
  "/companies/search-talents",
  "/talents/",  // Allow viewing talent profiles
  "/companies/",  // Allow viewing company profiles
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/admin/login",
  "/api/auth/thirdweb-login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/talents/job-search",
  "/api/companies/search-talents",
  "/api/companies/my-profile",  // For viewing company details
  "/api/companies/jobs",  // For viewing company jobs
  "/api/companies/job-data",  // For viewing single job
  "/api/talents/my-profile",  // For viewing talent details
];

// Helper function to check if a path is public
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => {
    if (publicPath === "/") {
      return path === "/";
    }
    return path.startsWith(publicPath);
  });
}

// Helper function to validate session token
async function validateSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const path = req.nextUrl.pathname;
  const hasConnectPrompt = req.nextUrl.searchParams.get("connectWallet") === "true";
  let response: NextResponse;

  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }

    // Skip authentication for public paths
    if (isPublicPath(path)) {
      response = NextResponse.next();
    }
    // Handle admin routes
    else if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
      const adminToken = req.cookies.get("admin_token")?.value;

      if (!adminToken) {
        if (path.startsWith("/api/")) {
          return NextResponse.json(
            {
              error: "Admin authentication required",
              code: "MISSING_ADMIN_TOKEN",
            },
            { status: 401 },
          );
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      try {
        await jwtVerify(adminToken, ADMIN_JWT_SECRET);
        response = NextResponse.next();
      } catch (error) {
        const authError = handleAuthError(error);
        console.error("Admin authentication error:", authError.message);

        if (path.startsWith("/api/")) {
          const errorResponse = NextResponse.json(
            { error: "Invalid admin session", code: "INVALID_ADMIN_TOKEN" },
            { status: 401 },
          );
          errorResponse.cookies.delete("admin_token");
          return errorResponse;
        }

        const redirectResponse = NextResponse.redirect(
          new URL("/admin/login", req.url),
        );
        redirectResponse.cookies.delete("admin_token");
        return redirectResponse;
      }
    }
    // Handle regular protected routes
    else {
      const sessionToken = req.cookies.get("session_token")?.value;

      if (!sessionToken) {
        if (path.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Authentication required", code: "MISSING_TOKEN" },
            { status: 401 },
          );
        }
        if (!hasConnectPrompt) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.searchParams.set("connectWallet", "true");
          return NextResponse.redirect(redirectUrl);
        }

        response = NextResponse.next();
        return response;
      }

      // Validate the session token
      const payload = await validateSessionToken(sessionToken);

      if (!payload) {
        // Clear invalid session cookies
        const redirectResponse = path.startsWith("/api/")
          ? NextResponse.json(
              { error: "Invalid session", code: "INVALID_TOKEN" },
              { status: 401 },
            )
          : (() => {
              if (!hasConnectPrompt) {
                const redirectUrl = req.nextUrl.clone();
                redirectUrl.searchParams.set("connectWallet", "true");
                const redirect = NextResponse.redirect(redirectUrl);
                redirect.cookies.delete("session_token");
                redirect.cookies.delete("user_id");
                redirect.cookies.delete("user_email");
                redirect.cookies.delete("user_address");
                return redirect;
              }

              const next = NextResponse.next();
              next.cookies.delete("session_token");
              next.cookies.delete("user_id");
              next.cookies.delete("user_email");
              next.cookies.delete("user_address");
              return next;
            })();
        if (path.startsWith("/api/")) {
          redirectResponse.cookies.delete("session_token");
          redirectResponse.cookies.delete("user_id");
          redirectResponse.cookies.delete("user_email");
          redirectResponse.cookies.delete("user_address");
        }
        return redirectResponse;
      }

      // Add user info to headers for API routes
      if (path.startsWith("/api/")) {
        response = NextResponse.next();
        response.headers.set("x-user-id", payload.user_id as string);
        response.headers.set("x-user-email", payload.email as string);
        response.headers.set(
          "x-wallet-address",
          payload.wallet_address as string,
        );
      } else {
        response = NextResponse.next();
      }
    }

    // Add security headers (temporarily disabled for Thirdweb development)
    // return addSecurityHeaders(response);
    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    if (!hasConnectPrompt) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.searchParams.set("connectWallet", "true");
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - img/ (static images)
     * - icons/ (static icons)
     * - public/ (all public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|img/|icons/|public/).*)",
  ],
};
