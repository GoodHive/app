import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { 
  generateOTP, 
  storeOTP, 
  checkRateLimit,
  cleanupExpiredOTPs 
} from "@/lib/auth/otpService";
import { sendOTPEmail } from "@/lib/email/emailService";

export async function POST(req: Request) {
  try {
    const { email, walletAddress, purpose, resend } = await req.json();

    // Validate input
    if (!email || !walletAddress) {
      return NextResponse.json(
        { error: "Email and wallet address are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Clean up expired OTPs periodically
    await cleanupExpiredOTPs();

    // Check rate limiting
    const canSendOTP = await checkRateLimit(email);
    if (!canSendOTP) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check if email already exists and is verified
    const existingUser = await sql`
      SELECT userid, email, email_verified, wallet_address, thirdweb_wallet_address
      FROM goodhive.users
      WHERE LOWER(email) = ${email.toLowerCase()}
      AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;

    if (existingUser.length > 0) {
      const user = existingUser[0];
      
      // If email is already verified for another account
      if (user.email_verified) {
        // Check if it's the same wallet trying to register
        const normalizedWallet = walletAddress.toLowerCase();
        const isOwnWallet = 
          user.wallet_address?.toLowerCase() === normalizedWallet ||
          user.thirdweb_wallet_address?.toLowerCase() === normalizedWallet;
        
        if (!isOwnWallet) {
          return NextResponse.json(
            { 
              error: "This email is already registered to another account.",
              suggestion: "Please login with your existing account or use a different email."
            },
            { status: 409 }
          );
        }
      }
    }

    // Generate OTP
    const otp = generateOTP();
    console.log(`Generated OTP for ${email}: ${otp}`); // Log for debugging (remove in production)

    // Store OTP in database
    const stored = await storeOTP(email, walletAddress, otp);
    if (!stored) {
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      email: email,
    });

  } catch (error) {
    console.error("Send OTP error:", error);
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