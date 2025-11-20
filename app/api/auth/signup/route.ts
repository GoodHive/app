import sql from "@/lib/db";
import bcrypt from "bcryptjs";
export async function POST(req: Request) {
  if (req.method === "POST") {
    const { email, password, referred_by } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email and Password are required" }),
        {
          status: 400,
        },
      );
    }

    try {
      // Check if the email already exists
      const existingUser = await sql`
        SELECT 1 FROM goodhive.users WHERE email = ${email};
      `;

      if (existingUser.count > 0) {
        return new Response(
          JSON.stringify({ message: "Email already exists" }),
          {
            status: 409,
          },
        );
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Validate referral code if provided
      let validReferralCode = null;
      if (referred_by) {
        const referralCheck = await sql`
          SELECT referral_code 
          FROM goodhive.referrals 
          WHERE referral_code = ${referred_by}
        `;
        
        if (referralCheck.length === 0) {
          // Invalid referral code - log but don't fail signup
          console.warn(`Invalid referral code provided: ${referred_by}`);
        } else {
          validReferralCode = referred_by;
        }
      }

      // Insert the new user into the database
      if (validReferralCode) {
        await sql`
        INSERT INTO goodhive.users (
          email,
          passwordHash,
          referred_by
        ) VALUES (
          ${email},
          ${hashedPassword},
          ${validReferralCode}
        );
      `;
      } else {
        await sql`
        INSERT INTO goodhive.users (
          email,
          passwordHash
        ) VALUES (
          ${email},
          ${hashedPassword}
        );
      `;
      }

      return new Response(
        JSON.stringify({ message: "User Created Successfully" }),
        {
          status: 200,
        },
      );
    } catch (error) {
      console.error("Error creating user", error);
      return new Response(
        JSON.stringify({ message: "There was an error creating your account" }),
        {
          status: 500,
        },
      );
    }
  } else {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }
}
