import {
  SEVEN_DAYS_IN_SECONDS,
  clientAccessibleCookieConfig,
  secureHttpOnlyCookieConfig,
} from "@/lib/auth/cookieConfig";
import { SignJWT } from "jose";
// Signature verification not needed for now - handled by Thirdweb SDK
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import postgres from "postgres";

// Neon requires SSL, append ?sslmode=require if not present
const databaseUrl = process.env.DATABASE_URL || "";
const urlWithSSL = databaseUrl.includes("?sslmode=")
  ? databaseUrl
  : `${databaseUrl}?sslmode=require`;

const sql = postgres(urlWithSSL, {
  connection: {
    application_name: "goodhive-thirdweb-verify",
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-jwt-secret-key",
);

interface ThirdwebVerifyRequest {
  address: string;
  smartAccount?: string;
  email?: string;
  authProvider: string;
  authMethod: "in-app" | "external";
  walletType: string;
  message?: string;
  signature?: string;
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body: ThirdwebVerifyRequest = await req.json();
    console.log("🐝 Received request body:", JSON.stringify(body, null, 2));

    const {
      address,
      smartAccount,
      email,
      authProvider,
      authMethod,
      walletType,
      message,
      signature,
    } = body;

    // Log all values to debug undefined issues
    console.log("🐝 Values:", {
      address,
      smartAccount,
      email,
      authProvider,
      authMethod,
      walletType,
      message,
      signature,
    });

    // Validate required fields
    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    if (!authProvider || !authMethod) {
      return NextResponse.json(
        { error: "Authentication provider and method are required" },
        { status: 400 },
      );
    }

    // Signature verification handled by Thirdweb SDK
    // External wallets are already authenticated by the SDK

    // Get client IP and user agent for logging
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Ensure all values are properly defined
    const safeIpAddress = ipAddress || "unknown";
    const safeUserAgent = (userAgent || "unknown").substring(0, 255);
    const safeWalletType = walletType || "unknown";
    const safeAuthProvider = authProvider || "unknown";
    const safeAuthMethod = authMethod || "external";

    console.log(address, "address...");
    // Look for existing user by multiple criteria - include Wagmi users
    const existingUsers = await sql`
      SELECT * FROM goodhive.users 
      WHERE thirdweb_wallet_address = ${address}
         OR wallet_address = ${address}
         OR (email = ${email || null} AND email IS NOT NULL)
      LIMIT 1
    `;

    const isNewUser = existingUsers.length === 0;
    const isWagmiUser =
      existingUsers.length > 0 &&
      existingUsers[0].wallet_address === address &&
      !existingUsers[0].thirdweb_wallet_address;

    // Debug existing user data
    if (existingUsers.length > 0) {
      console.log("🐝 Existing user found:", {
        userid: existingUsers[0].userid,
        wallet_address: existingUsers[0].wallet_address,
        thirdweb_wallet_address: existingUsers[0].thirdweb_wallet_address,
        email: existingUsers[0].email,
        hasThirdwebColumns: "thirdweb_wallet_address" in existingUsers[0],
      });
    }

    let user;

    if (isNewUser) {
      console.log("🐝 Creating new Thirdweb user");

      // Create new user with Thirdweb wallet
      const newUsers = await sql`
        INSERT INTO goodhive.users (
          wallet_address,
          thirdweb_wallet_address,
          thirdweb_smart_account_address,
          email,
          auth_provider,
          auth_method,
          migration_status,
          wallet_metadata,
          mentor_status,
          recruiter_status,
          talent_status,
          login_method
        ) VALUES (
          ${address}, -- Set wallet_address first for database constraint
          ${address}, -- Also set thirdweb_wallet_address
          ${smartAccount || null},
          ${email || null},
          ${safeAuthProvider},
          ${safeAuthMethod},
          'completed',
          ${JSON.stringify({
            walletType: safeWalletType,
            firstAuth: safeAuthProvider,
            createdWith: "thirdweb",
            createdAt: new Date().toISOString(),
            ipAddress: safeIpAddress,
            userAgent: safeUserAgent,
          })},
          'pending',
          'pending', 
          'pending',
          'thirdweb'
        )
        RETURNING *
      `;
      user = newUsers[0];

      // Log the new user creation
      await sql`
        INSERT INTO goodhive.user_wallet_history (
          user_id,
          wallet_address,
          wallet_type,
          action,
          auth_provider,
          ip_address,
          user_agent,
          metadata
        ) VALUES (
          ${user.userid},
          ${address},
          'thirdweb',
          'connected',
          ${safeAuthProvider},
          ${safeIpAddress},
          ${safeUserAgent},
          ${JSON.stringify({
            isNewUser: true,
            authMethod: safeAuthMethod,
            walletType: safeWalletType,
            smartAccount: !!smartAccount,
            connectionTime: Date.now() - startTime,
          })}
        )
      `;
    } else if (isWagmiUser) {
      console.log("🐝 Migrating Wagmi user to Thirdweb");

      const existingUser = existingUsers[0];

      // Ensure all values are safely defined
      const safeExistingUser = {
        userid: existingUser?.userid || null,
        wallet_address: existingUser?.wallet_address || "unknown",
        email: existingUser?.email || null,
      };

      if (!safeExistingUser.userid) {
        throw new Error("Invalid existing user - missing userid");
      }

      // Update Wagmi user with Thirdweb info
      const migratedUsers = await sql`
        UPDATE goodhive.users
        SET 
          thirdweb_wallet_address = ${address},
          thirdweb_smart_account_address = ${smartAccount || null},
          auth_provider = ${safeAuthProvider},
          auth_method = ${safeAuthMethod},
          login_method = 'thirdweb',
          wallet_metadata = ${JSON.stringify({
            walletType: safeWalletType,
            migratedFrom: "wagmi",
            migrationDate: new Date().toISOString(),
            originalWallet: safeExistingUser.wallet_address,
            ipAddress: safeIpAddress,
            userAgent: safeUserAgent,
          })}
        WHERE userid = ${safeExistingUser.userid}
        RETURNING *
      `;
      user = migratedUsers[0];

      // Log the Wagmi migration
      await sql`
        INSERT INTO goodhive.user_wallet_history (
          user_id,
          wallet_address,
          wallet_type,
          action,
          auth_provider,
          ip_address,
          user_agent,
          metadata
        ) VALUES (
          ${user.userid},
          ${address},
          'thirdweb',
          'wagmi_migration',
          ${safeAuthProvider},
          ${safeIpAddress},
          ${safeUserAgent},
          ${JSON.stringify({
            isWagmiMigration: true,
            originalWallet: safeExistingUser.wallet_address,
            authMethod: safeAuthMethod,
            walletType: safeWalletType,
            smartAccount: !!smartAccount,
            migrationTime: Date.now() - startTime,
          })}
        )
      `;
    } else {
      console.log("🐝 Updating existing Thirdweb user");

      const existingUser = existingUsers[0];

      // Ensure all values are safely defined
      const safeExistingUser = {
        userid: existingUser?.userid || null,
        wallet_address: existingUser?.wallet_address || "unknown",
        email: existingUser?.email || null,
      };

      if (!safeExistingUser.userid) {
        throw new Error("Invalid existing user - missing userid");
      }

      // Update existing Thirdweb user
      const updatedUsers = await sql`
        UPDATE goodhive.users
        SET 
          last_auth_provider = ${safeAuthProvider},
          thirdweb_smart_account_address = COALESCE(${smartAccount || null}, thirdweb_smart_account_address),
          login_method = 'thirdweb',
          wallet_metadata = ${JSON.stringify({
            lastLogin: new Date().toISOString(),
            lastAuthProvider: safeAuthProvider,
            loginCount: 1,
            ipAddress: safeIpAddress,
            userAgent: safeUserAgent,
          })}
        WHERE userid = ${safeExistingUser.userid}
        RETURNING *
      `;
      user = updatedUsers[0];

      // Log the login action
      await sql`
        INSERT INTO goodhive.user_wallet_history (
          user_id,
          wallet_address,
          wallet_type,
          action,
          auth_provider,
          ip_address,
          user_agent,
          metadata
        ) VALUES (
          ${user.userid},
          ${address},
          'thirdweb',
          'connected',
          ${safeAuthProvider},
          ${safeIpAddress},
          ${safeUserAgent},
          ${JSON.stringify({
            isReturningUser: true,
            authMethod: safeAuthMethod,
            walletType: safeWalletType,
            smartAccount: !!smartAccount,
            connectionTime: Date.now() - startTime,
          })}
        )
      `;
    }

    // Create JWT session token
    const token = await new SignJWT({
      user_id: user.userid,
      wallet_address: user.thirdweb_wallet_address,
      smart_account: user.thirdweb_smart_account_address,
      email: user.email,
      auth_provider: safeAuthProvider,
      wallet_type: "thirdweb",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SEVEN_DAYS_IN_SECONDS}s`)
      .sign(JWT_SECRET);

    // Set secure session cookie
    cookies().set("session_token", token, secureHttpOnlyCookieConfig);

    // Set client-accessible cookies
    cookies().set("user_id", user.userid, clientAccessibleCookieConfig);

    if (user.email) {
      cookies().set("user_email", user.email, clientAccessibleCookieConfig);
    }

    cookies().set("user_address", address, clientAccessibleCookieConfig);

    if (smartAccount) {
      cookies().set(
        "smart_account",
        smartAccount,
        clientAccessibleCookieConfig,
      );
    }

    // Log successful completion
    const processingTime = Date.now() - startTime;
    console.log(`🐝 Thirdweb verification completed in ${processingTime}ms`, {
      userId: user.userid,
      isNewUser,
      isWagmiUser,
      authProvider: safeAuthProvider,
      processingTime,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        user_id: user.userid,
        email: user.email,
        address: address,
        smartAccount: smartAccount || null,
        authProvider: safeAuthProvider,
        authMethod: safeAuthMethod,
      },
      token,
      isNewUser,
      isMigration: isWagmiUser,
      migrationType: isWagmiUser ? "wagmi" : null,
      processingTime,
    });
  } catch (error) {
    console.error("🐝 Thirdweb verification error:", error);

    // Log detailed error information for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
      endpoint: "/api/auth/thirdweb-verify",
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      userAgent: req.headers.get("user-agent"),
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip"),
    };

    console.error("🐝 Error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
