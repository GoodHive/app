import sql from "@/lib/db";
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/auth/jwtConfig";

// Merge two user accounts
export async function POST(req: Request) {
  try {
    const sessionToken = req.headers.get("cookie")?.split("; ")
      .find(row => row.startsWith("session_token="))
      ?.split("=")[1];
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const currentUserId = payload.user_id as string;

    const { secondaryAccountId } = await req.json();

    if (!secondaryAccountId) {
      return NextResponse.json(
        { error: "Secondary account ID is required" },
        { status: 400 }
      );
    }

    // Get both accounts
    const [currentAccount] = await sql`
      SELECT * FROM goodhive.users
      WHERE userid = ${currentUserId}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    const [secondaryAccount] = await sql`
      SELECT * FROM goodhive.users
      WHERE userid = ${secondaryAccountId}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    if (!currentAccount || !secondaryAccount) {
      return NextResponse.json(
        { error: "One or both accounts not found" },
        { status: 404 }
      );
    }

    // Determine which should be primary (prefer account with both email and wallet)
    let primaryAccount = currentAccount;
    let accountToMerge = secondaryAccount;

    // If secondary has both email and wallet, make it primary
    if (secondaryAccount.email && secondaryAccount.wallet_address) {
      primaryAccount = secondaryAccount;
      accountToMerge = currentAccount;
    }
    // If current has only wallet and secondary has email, use secondary as primary
    else if (!currentAccount.email && secondaryAccount.email) {
      primaryAccount = secondaryAccount;
      accountToMerge = currentAccount;
    }

    // Merge the accounts
    const mergedWallets = [
      ...(primaryAccount.merged_wallet_addresses || []),
      accountToMerge.wallet_address
    ].filter(Boolean);

    const mergedFromIds = [
      ...(primaryAccount.merged_from_user_ids || []),
      accountToMerge.userid
    ];

    await sql`
      UPDATE goodhive.users
      SET 
        merged_wallet_addresses = ${sql.array(mergedWallets)},
        merged_from_user_ids = ${sql.array(mergedFromIds)},
        email = COALESCE(${primaryAccount.email}, ${accountToMerge.email}),
        wallet_address = COALESCE(${primaryAccount.wallet_address}, ${accountToMerge.wallet_address}),
        auth_method = CASE 
          WHEN ${primaryAccount.email} IS NOT NULL AND ${primaryAccount.wallet_address} IS NOT NULL THEN 'hybrid'
          WHEN ${accountToMerge.email} IS NOT NULL AND ${primaryAccount.wallet_address} IS NOT NULL THEN 'hybrid'
          WHEN ${primaryAccount.email} IS NOT NULL AND ${accountToMerge.wallet_address} IS NOT NULL THEN 'hybrid'
          WHEN COALESCE(${primaryAccount.email}, ${accountToMerge.email}) IS NOT NULL THEN 'email'
          ELSE 'wallet'
        END,
        updated_at = NOW()
      WHERE userid = ${primaryAccount.userid}
    `;

    // Mark secondary account as merged
    await sql`
      UPDATE goodhive.users
      SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        email = CASE 
          WHEN email IS NOT NULL THEN email || '_merged_' || ${accountToMerge.userid}::TEXT
          ELSE NULL
        END,
        wallet_address = CASE
          WHEN wallet_address IS NOT NULL THEN wallet_address || '_merged_' || ${accountToMerge.userid}::TEXT
          ELSE NULL
        END
      WHERE userid = ${accountToMerge.userid}
    `;

    // Generate new JWT for the primary account
    const token = await new SignJWT({
      user_id: primaryAccount.userid,
      email: primaryAccount.email || accountToMerge.email || null,
      wallet_address: primaryAccount.wallet_address || accountToMerge.wallet_address,
      auth_method: primaryAccount.email && primaryAccount.wallet_address ? 'hybrid' : 
                   primaryAccount.email ? 'email' : 'wallet',
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      message: "Accounts merged successfully",
      user: {
        user_id: primaryAccount.userid,
        email: primaryAccount.email || accountToMerge.email,
        wallet_address: primaryAccount.wallet_address || accountToMerge.wallet_address,
        merged_wallets: mergedWallets,
        auth_method: primaryAccount.email && primaryAccount.wallet_address ? 'hybrid' : 
                     primaryAccount.email ? 'email' : 'wallet',
      }
    });

    // Update cookies with new session
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("user_id", primaryAccount.userid.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Merge accounts error:", error);
    return NextResponse.json(
      { error: "Failed to merge accounts" },
      { status: 500 }
    );
  }
}

// Check for duplicate accounts
export async function GET(req: Request) {
  try {
    const sessionToken = req.headers.get("cookie")?.split("; ")
      .find(row => row.startsWith("session_token="))
      ?.split("=")[1];
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.user_id as string;

    // Get current user
    const [currentUser] = await sql`
      SELECT email, wallet_address FROM goodhive.users
      WHERE userid = ${userId}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find potential duplicate accounts
    const duplicates = await sql`
      SELECT userid, email, wallet_address, auth_method
      FROM goodhive.users
      WHERE userid != ${userId}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
      AND (
        (${currentUser.email} IS NOT NULL AND LOWER(email) = LOWER(${currentUser.email}))
        OR
        (${currentUser.wallet_address} IS NOT NULL AND LOWER(wallet_address) = LOWER(${currentUser.wallet_address}))
      )
    `;

    return NextResponse.json({
      duplicates: duplicates.map(dup => ({
        user_id: dup.userid,
        email: dup.email,
        wallet_address: dup.wallet_address,
        auth_method: dup.auth_method,
      }))
    });

  } catch (error) {
    console.error("Check duplicates error:", error);
    return NextResponse.json(
      { error: "Failed to check for duplicate accounts" },
      { status: 500 }
    );
  }
}