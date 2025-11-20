import { JWT_SECRET } from "@/lib/auth/jwtConfig";
import sql from "@/lib/db";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { walletAddress, email, isThirdwebWallet, walletType, referred_by } =
      await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();

    let user: any;
    let isNewUser = false;
    let hasDuplicates = false;
    let duplicateAccounts: any[] = [];
    let extractedEmail = email;

    // Log incoming data for debugging
    console.log("Thirdweb login request:", {
      walletAddress: normalizedAddress,
      email: extractedEmail,
      isThirdwebWallet,
      walletType,
    });

    // If it's a Thirdweb in-app wallet and no email provided, try to extract from API
    if (isThirdwebWallet && !extractedEmail) {
      try {
        const thirdwebResponse = await fetch(
          `${req.url.split("/api")[0]}/api/auth/thirdweb-user-info?walletAddress=${normalizedAddress}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (thirdwebResponse.ok) {
          const thirdwebData = await thirdwebResponse.json();
          if (thirdwebData.userInfo?.primaryEmail) {
            extractedEmail = thirdwebData.userInfo.primaryEmail;
            console.log("Email extracted from Thirdweb API:", extractedEmail);
          }
        }
      } catch (error) {
        console.error("Failed to fetch email from Thirdweb API:", error);
      }
    }

    try {
      let existingUser: any[] = [];

      // PRIORITY 1: If we have an email (from social login), search by email FIRST
      // This ensures users logging in with social accounts always get their existing account
      if (extractedEmail) {
        console.log("Searching for user by email first:", extractedEmail);
        existingUser = await sql`
          SELECT * FROM goodhive.users
          WHERE LOWER(email) = ${extractedEmail.toLowerCase()}
          AND (is_deleted IS NULL OR is_deleted = FALSE)
        `;

        if (existingUser.length > 0) {
          console.log("Found existing user by email:", existingUser[0].userid);
        }
      }

      // PRIORITY 2: If no user found by email, search by wallet address
      if (existingUser.length === 0) {
        console.log(
          "No user found by email, searching by wallet address:",
          normalizedAddress,
        );

        if (isThirdwebWallet) {
          // Search by thirdweb_wallet_address
          existingUser = await sql`
            SELECT * FROM goodhive.users 
            WHERE LOWER(thirdweb_wallet_address) = ${normalizedAddress}
              AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;
        } else {
          // Search by external wallet_address
          existingUser = await sql`
            SELECT * FROM goodhive.users 
            WHERE LOWER(wallet_address) = ${normalizedAddress}
              AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;
        }
      }

      // PRIORITY 3: If still not found, check merged wallets
      if (existingUser.length === 0) {
        existingUser = await sql`
          SELECT * FROM goodhive.users 
          WHERE ${normalizedAddress} = ANY(
            SELECT LOWER(unnest(merged_wallet_addresses))
            FROM goodhive.users
            WHERE merged_wallet_addresses IS NOT NULL
          )
          AND (is_deleted IS NULL OR is_deleted = FALSE)
        `;
      }

      if (existingUser.length > 0) {
        user = existingUser[0];

        // Check for duplicate accounts with same email
        if (extractedEmail) {
          duplicateAccounts = await sql`
            SELECT userid, email, wallet_address, thirdweb_wallet_address, auth_method
            FROM goodhive.users
            WHERE LOWER(email) = ${extractedEmail.toLowerCase()}
            AND userid != ${user.userid}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;

          hasDuplicates = duplicateAccounts.length > 0;
        }

        // Update wallet address if it's different (common with social wallets that generate new addresses)
        // Or add wallet address if user doesn't have one yet
        if (
          isThirdwebWallet &&
          (!user.thirdweb_wallet_address ||
            user.thirdweb_wallet_address.toLowerCase() !== normalizedAddress)
        ) {
          // Check if this wallet address is already used by another user
          const walletInUse = await sql`
            SELECT userid FROM goodhive.users 
            WHERE LOWER(thirdweb_wallet_address) = ${normalizedAddress}
            AND userid != ${user.userid}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;

          if (walletInUse.length > 0) {
            console.warn(
              `Wallet address ${normalizedAddress} is already in use by user ${walletInUse[0].userid}`,
            );
            // Don't update if wallet is in use by another user
          } else {
            try {
              await sql`
                UPDATE goodhive.users
                SET 
                  thirdweb_wallet_address = ${normalizedAddress},
                  wallet_type = CASE
                    WHEN wallet_address IS NOT NULL THEN 'both'
                    ELSE 'in-app'
                  END,
                  email = COALESCE(email, ${extractedEmail ? extractedEmail.toLowerCase() : null})
                WHERE userid = ${user.userid}
              `;

              // Refresh user data
              const updatedUser = await sql`
                SELECT * FROM goodhive.users WHERE userid = ${user.userid}
              `;
              user = updatedUser[0];
            } catch (updateError: any) {
              console.error(
                "Error updating thirdweb_wallet_address:",
                updateError,
              );
              // Continue with existing user data if update fails
            }
          }
        } else if (!isThirdwebWallet && !user.wallet_address) {
          // Check if this wallet address is already used by another user
          const walletInUse = await sql`
            SELECT userid FROM goodhive.users 
            WHERE LOWER(wallet_address) = ${normalizedAddress}
            AND userid != ${user.userid}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;

          if (walletInUse.length > 0) {
            console.warn(
              `Wallet address ${normalizedAddress} is already in use by user ${walletInUse[0].userid}`,
            );
            // Don't update if wallet is in use by another user
          } else {
            try {
              await sql`
                UPDATE goodhive.users
                SET 
                  wallet_address = ${normalizedAddress},
                  wallet_type = CASE
                    WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                    ELSE 'external'
                  END
                WHERE userid = ${user.userid}
              `;

              // Refresh user data
              const updatedUser = await sql`
                SELECT * FROM goodhive.users WHERE userid = ${user.userid}
              `;
              user = updatedUser[0];
            } catch (updateError: any) {
              console.error("Error updating wallet_address:", updateError);
              // Continue with existing user data if update fails
            }
          }
        }
      } else {
        // Check if email exists in another account
        if (extractedEmail) {
          const emailUser = await sql`
            SELECT * FROM goodhive.users
            WHERE LOWER(email) = ${extractedEmail.toLowerCase()}
            AND (is_deleted IS NULL OR is_deleted = FALSE)
          `;

          if (emailUser.length > 0) {
            // Email exists - add wallet to existing account
            user = emailUser[0];

            // Check if wallet is already in use by another user
            let walletInUse = [];
            if (isThirdwebWallet) {
              walletInUse = await sql`
                SELECT userid FROM goodhive.users 
                WHERE LOWER(thirdweb_wallet_address) = ${normalizedAddress}
                AND userid != ${user.userid}
                AND (is_deleted IS NULL OR is_deleted = FALSE)
              `;
            } else {
              walletInUse = await sql`
                SELECT userid FROM goodhive.users 
                WHERE LOWER(wallet_address) = ${normalizedAddress}
                AND userid != ${user.userid}
                AND (is_deleted IS NULL OR is_deleted = FALSE)
              `;
            }

            if (walletInUse.length > 0) {
              console.warn(
                `Wallet address ${normalizedAddress} is already in use by user ${walletInUse[0].userid}, but email matches user ${user.userid}`,
              );
              // This is a conflict - wallet belongs to different user but email matches
              // We'll use the email-matched user but log the warning
            }

            try {
              if (isThirdwebWallet) {
                await sql`
                  UPDATE goodhive.users
                  SET 
                    thirdweb_wallet_address = ${normalizedAddress},
                    wallet_type = CASE
                      WHEN wallet_address IS NOT NULL THEN 'both'
                      ELSE 'in-app'
                    END,
                    auth_method = CASE
                      WHEN wallet_address IS NOT NULL THEN 'hybrid'
                      ELSE 'email'
                    END
                  WHERE userid = ${user.userid}
                `;
              } else {
                await sql`
                  UPDATE goodhive.users
                  SET 
                    wallet_address = ${normalizedAddress},
                    wallet_type = CASE
                      WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                      ELSE 'external'
                    END,
                    auth_method = 'hybrid'
                  WHERE userid = ${user.userid}
                `;
              }

              // Refresh user data
              const updatedUser = await sql`
                SELECT * FROM goodhive.users WHERE userid = ${user.userid}
              `;
              user = updatedUser[0];
            } catch (updateError: any) {
              console.error("Error updating user wallet:", updateError);
              // Continue with existing user data if update fails
            }
          }
        }

        // If still no user, check if it's a Thirdweb wallet without email
        if (!user) {
          // For Thirdweb wallets, require email verification first
          if (isThirdwebWallet && !extractedEmail) {
            return NextResponse.json({
              requiresEmailVerification: true,
              message: "Email verification required",
              walletAddress: normalizedAddress,
            });
          }

          // Double-check for existing wallet address before inserting (race condition protection)
          let duplicateWalletCheck = [];
          if (isThirdwebWallet) {
            duplicateWalletCheck = await sql`
              SELECT * FROM goodhive.users 
              WHERE LOWER(thirdweb_wallet_address) = ${normalizedAddress}
              AND (is_deleted IS NULL OR is_deleted = FALSE)
            `;
          } else {
            duplicateWalletCheck = await sql`
              SELECT * FROM goodhive.users 
              WHERE LOWER(wallet_address) = ${normalizedAddress}
              AND (is_deleted IS NULL OR is_deleted = FALSE)
            `;
          }

          if (duplicateWalletCheck.length > 0) {
            // Wallet exists, use that user
            user = duplicateWalletCheck[0];

            // Update email if we have one and user doesn't
            if (extractedEmail && !user.email) {
              await sql`
                UPDATE goodhive.users
                SET 
                  email = ${extractedEmail.toLowerCase()},
                  email_verified = ${extractedEmail ? false : null},
                  auth_method = CASE
                    WHEN wallet_address IS NOT NULL OR thirdweb_wallet_address IS NOT NULL THEN 'hybrid'
                    ELSE 'email'
                  END
                WHERE userid = ${user.userid}
              `;

              // Refresh user data
              const updatedUser = await sql`
                SELECT * FROM goodhive.users WHERE userid = ${user.userid}
              `;
              user = updatedUser[0];
            }
          } else {
            // Create new user only if we have email or it's external wallet
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

            try {
              const insertResult = await sql`
                INSERT INTO goodhive.users (
                  wallet_address,
                  thirdweb_wallet_address,
                  wallet_type,
                  auth_method,
                  email,
                  email_verified,
                  referred_by
                ) VALUES (
                  ${isThirdwebWallet ? null : normalizedAddress},
                  ${isThirdwebWallet ? normalizedAddress : null},
                  ${isThirdwebWallet ? "in-app" : "external"},
                  ${extractedEmail ? "hybrid" : "wallet"},
                  ${extractedEmail ? extractedEmail.toLowerCase() : null},
                  ${extractedEmail ? false : null},
                  ${validReferralCode}
                )
                RETURNING *
              `;

              user = insertResult[0];
              isNewUser = true;
            } catch (insertError: any) {
              // Handle unique constraint violations
              if (
                insertError?.code === "23505" ||
                insertError?.message?.includes("unique") ||
                insertError?.message?.includes("duplicate")
              ) {
                console.error(
                  "Unique constraint violation, retrying lookup:",
                  insertError,
                );

                // Retry lookup - wallet might have been inserted by another request
                if (isThirdwebWallet) {
                  const retryUser = await sql`
                    SELECT * FROM goodhive.users 
                    WHERE LOWER(thirdweb_wallet_address) = ${normalizedAddress}
                    AND (is_deleted IS NULL OR is_deleted = FALSE)
                  `;
                  if (retryUser.length > 0) {
                    user = retryUser[0];
                  }
                } else {
                  const retryUser = await sql`
                    SELECT * FROM goodhive.users 
                    WHERE LOWER(wallet_address) = ${normalizedAddress}
                    AND (is_deleted IS NULL OR is_deleted = FALSE)
                  `;
                  if (retryUser.length > 0) {
                    user = retryUser[0];
                  }
                }

                if (!user) {
                  throw insertError; // Re-throw if we still can't find the user
                }
              } else {
                throw insertError; // Re-throw other errors
              }
            }
          }
        }
      }

      // Generate JWT session token
      const token = await new SignJWT({
        user_id: user.userid,
        email: user.email || null,
        wallet_address: user.wallet_address,
        auth_method: user.auth_method || "wallet",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d") // 7 days expiry
        .sign(JWT_SECRET);

      // Create response with user data
      const response = NextResponse.json({
        message: isNewUser
          ? "Account created successfully"
          : "Login successful",
        user: {
          user_id: user.userid,
          email: user.email,
          wallet_address: user.wallet_address,
          auth_method: user.auth_method,
        },
        isNewUser,
        hasDuplicates,
        duplicateAccounts: duplicateAccounts.map((acc) => ({
          user_id: acc.userid,
          email: acc.email,
          wallet_address: acc.wallet_address,
          auth_method: acc.auth_method,
        })),
        token,
      });

      // Set secure HTTP-only cookies
      response.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });

      response.cookies.set("user_id", user.userid.toString(), {
        httpOnly: false, // Allow client access for backward compatibility
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      if (user.email) {
        response.cookies.set("user_email", user.email, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
      }

      response.cookies.set(
        "loggedIn_user",
        JSON.stringify({
          user_id: user.userid,
          email: user.email,
          wallet_address: user.wallet_address,
          talent: user.talent || false,
          mentor: user.mentor || false,
          recruiter: user.recruiter || false,
          talent_status: user.talent_status || "pending",
          mentor_status: user.mentor_status || "pending",
          recruiter_status: user.recruiter_status || "pending",
        }),
        {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        },
      );

      return response;
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      console.error("Error details:", {
        message: dbError?.message,
        code: dbError?.code,
        detail: dbError?.detail,
        constraint: dbError?.constraint,
        stack: dbError?.stack,
      });

      // Provide more specific error messages
      let errorMessage = "Database error during authentication";
      if (dbError?.code === "23505") {
        errorMessage =
          "An account with this wallet address or email already exists";
      } else if (dbError?.code === "23502") {
        errorMessage = "Required field is missing";
      } else if (dbError?.code === "23514") {
        errorMessage = "Invalid data value";
      } else if (dbError?.message) {
        errorMessage = `Database error: ${dbError.message}`;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details:
            process.env.NODE_ENV === "development"
              ? {
                  code: dbError?.code,
                  message: dbError?.message,
                  constraint: dbError?.constraint,
                }
              : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Thirdweb authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS request for CORS
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
