import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/auth/jwtConfig";
import { verifyOTP } from "@/lib/auth/otpService";
import { sendWelcomeEmail } from "@/lib/email/emailService";

export async function POST(req: Request) {
  try {
    const { email, otp, walletAddress, referred_by } = await req.json();

    // Validate input
    if (!email || !otp || !walletAddress) {
      return NextResponse.json(
        { error: "Email, OTP, and wallet address are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const verification = await verifyOTP(email, otp);
    
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Normalize addresses
    const normalizedEmail = email.toLowerCase();
    const normalizedWallet = walletAddress.toLowerCase();

    // Check if user exists with this email
    let user;
    const existingUser = await sql`
      SELECT * FROM goodhive.users
      WHERE LOWER(email) = ${normalizedEmail}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    if (existingUser.length > 0) {
      // User exists - update with wallet and mark email as verified
      user = existingUser[0];
      
      // Determine wallet type based on address pattern or existing data
      const isThirdwebWallet = !walletAddress.startsWith("0x") || walletAddress.length !== 42;
      
      if (isThirdwebWallet) {
        await sql`
          UPDATE goodhive.users
          SET 
            thirdweb_wallet_address = COALESCE(thirdweb_wallet_address, ${normalizedWallet}),
            email_verified = TRUE,
            email_verification_token = NULL,
            email_verification_sent_at = NULL,
            wallet_type = CASE
              WHEN wallet_address IS NOT NULL THEN 'both'
              ELSE 'in-app'
            END,
            auth_method = CASE
              WHEN wallet_address IS NOT NULL THEN 'hybrid'
              ELSE 'hybrid'
            END
          WHERE userid = ${user.userid}
        `;
      } else {
        await sql`
          UPDATE goodhive.users
          SET 
            wallet_address = COALESCE(wallet_address, ${normalizedWallet}),
            email_verified = TRUE,
            email_verification_token = NULL,
            email_verification_sent_at = NULL,
            wallet_type = CASE
              WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
              ELSE 'external'
            END,
            auth_method = 'hybrid'
          WHERE userid = ${user.userid}
        `;
      }
      
      // Fetch updated user
      const updatedUser = await sql`
        SELECT * FROM goodhive.users WHERE userid = ${user.userid}
      `;
      user = updatedUser[0];
      
    } else {
      // Check if wallet exists
      const existingWalletUser = await sql`
        SELECT * FROM goodhive.users
        WHERE (
          LOWER(wallet_address) = ${normalizedWallet}
          OR LOWER(thirdweb_wallet_address) = ${normalizedWallet}
        )
        AND (is_deleted IS NULL OR is_deleted = FALSE)
      `;

      if (existingWalletUser.length > 0) {
        // Wallet exists - add email and mark as verified
        user = existingWalletUser[0];
        
        await sql`
          UPDATE goodhive.users
          SET 
            email = ${normalizedEmail},
            email_verified = TRUE,
            email_verification_token = NULL,
            email_verification_sent_at = NULL,
            auth_method = 'hybrid'
          WHERE userid = ${user.userid}
        `;
        
        // Fetch updated user
        const updatedUser = await sql`
          SELECT * FROM goodhive.users WHERE userid = ${user.userid}
        `;
        user = updatedUser[0];
        
      } else {
        // Create new user
        const isThirdwebWallet = !walletAddress.startsWith("0x") || walletAddress.length !== 42;
        
        // Validate referral code if provided
        let validReferralCode = null;
        if (referred_by) {
          const referralCheck = await sql`
            SELECT referral_code 
            FROM goodhive.referrals 
            WHERE referral_code = ${referred_by}
          `;
          
          if (referralCheck.length > 0) {
            validReferralCode = referred_by;
          } else {
            console.warn(`Invalid referral code provided: ${referred_by}`);
          }
        }
        
        const newUser = await sql`
          INSERT INTO goodhive.users (
            email,
            ${isThirdwebWallet ? sql`thirdweb_wallet_address` : sql`wallet_address`},
            wallet_type,
            auth_method,
            email_verified,
            referred_by
          ) VALUES (
            ${normalizedEmail},
            ${normalizedWallet},
            ${isThirdwebWallet ? 'in-app' : 'external'},
            'hybrid',
            TRUE,
            ${validReferralCode}
          )
          RETURNING *
        `;
        
        user = newUser[0];
        
        // Send welcome email for new user
        await sendWelcomeEmail(normalizedEmail, true);
      }
    }

    // Generate JWT session token
    const token = await new SignJWT({
      user_id: user.userid,
      email: user.email,
      wallet_address: user.wallet_address || user.thirdweb_wallet_address,
      auth_method: user.auth_method || 'hybrid',
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user: {
        user_id: user.userid,
        email: user.email,
        wallet_address: user.wallet_address,
        thirdweb_wallet_address: user.thirdweb_wallet_address,
        auth_method: user.auth_method,
        email_verified: true,
      },
      token,
    });

    // Set cookies
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    response.cookies.set("user_id", user.userid.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("user_email", user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("loggedIn_user", JSON.stringify({
      user_id: user.userid,
      email: user.email,
      wallet_address: user.wallet_address,
      thirdweb_wallet_address: user.thirdweb_wallet_address,
      auth_method: user.auth_method,
      email_verified: true,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}