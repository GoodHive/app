import crypto from "crypto";
import sql from "@/lib/db";

interface OTPData {
  code: string;
  email: string;
  walletAddress: string;
  expiresAt: Date;
  attempts: number;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp + (process.env.OTP_SECRET || ""))
    .digest("hex");
}

/**
 * Store OTP in database
 */
export async function storeOTP(
  email: string,
  walletAddress: string,
  otp: string
): Promise<boolean> {
  try {
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if there's an existing OTP for this email
    const existing = await sql`
      SELECT * FROM goodhive.user_otp_verifications
      WHERE LOWER(email) = ${email.toLowerCase()}
      AND expires_at > NOW()
    `;

    if (existing.length > 0) {
      // Update existing OTP
      await sql`
        UPDATE goodhive.user_otp_verifications
        SET 
          otp_code = ${hashedOTP},
          expires_at = ${expiresAt},
          attempts = 0,
          created_at = NOW()
        WHERE LOWER(email) = ${email.toLowerCase()}
      `;
    } else {
      // Insert new OTP
      await sql`
        INSERT INTO goodhive.user_otp_verifications (
          email,
          wallet_address,
          otp_code,
          expires_at,
          attempts,
          created_at
        ) VALUES (
          ${email.toLowerCase()},
          ${walletAddress.toLowerCase()},
          ${hashedOTP},
          ${expiresAt},
          0,
          NOW()
        )
      `;
    }

    return true;
  } catch (error) {
    console.error("Error storing OTP:", error);
    return false;
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  email: string,
  otp: string
): Promise<{ valid: boolean; walletAddress?: string }> {
  try {
    const hashedOTP = hashOTP(otp);

    // Get stored OTP
    const result = await sql`
      SELECT * FROM goodhive.user_otp_verifications
      WHERE LOWER(email) = ${email.toLowerCase()}
      AND otp_code = ${hashedOTP}
      AND expires_at > NOW()
      AND attempts < 3
    `;

    if (result.length === 0) {
      // Increment attempts if OTP exists but doesn't match
      await sql`
        UPDATE goodhive.user_otp_verifications
        SET attempts = attempts + 1
        WHERE LOWER(email) = ${email.toLowerCase()}
        AND expires_at > NOW()
      `;
      
      return { valid: false };
    }

    // OTP is valid - delete it
    await sql`
      DELETE FROM goodhive.user_otp_verifications
      WHERE LOWER(email) = ${email.toLowerCase()}
    `;

    return { 
      valid: true, 
      walletAddress: result[0].wallet_address 
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { valid: false };
  }
}

/**
 * Check rate limiting for OTP requests
 */
export async function checkRateLimit(email: string): Promise<boolean> {
  try {
    // Check how many OTPs were sent in the last hour
    const result = await sql`
      SELECT COUNT(*) as count
      FROM goodhive.user_otp_verifications
      WHERE LOWER(email) = ${email.toLowerCase()}
      AND created_at > NOW() - INTERVAL '1 hour'
    `;

    const count = parseInt(result[0].count);
    return count < 3; // Allow max 3 OTPs per hour
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return false;
  }
}

/**
 * Clean up expired OTPs
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await sql`
      DELETE FROM goodhive.user_otp_verifications
      WHERE expires_at < NOW()
    `;
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
  }
}