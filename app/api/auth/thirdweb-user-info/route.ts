import { NextResponse } from "next/server";

const THIRDWEB_API_BASE = "https://in-app-wallet.thirdweb.com/api/2023-11-30/embedded-wallet";

// Get user details from Thirdweb by wallet address
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");
    const email = searchParams.get("email");

    if (!walletAddress && !email) {
      return NextResponse.json(
        { error: "Either walletAddress or email is required" },
        { status: 400 }
      );
    }

    const thirdwebSecret = process.env.THIRDWEB_SECRET_KEY;
    if (!thirdwebSecret) {
      return NextResponse.json(
        { error: "Thirdweb secret key not configured" },
        { status: 500 }
      );
    }

    // Determine query parameter
    const queryBy = email ? "email" : "walletAddress";
    const queryValue = email || walletAddress;

    const apiUrl = `${THIRDWEB_API_BASE}/user-details?queryBy=${queryBy}&${queryBy}=${queryValue}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${thirdwebSecret}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "User not found in Thirdweb", userExists: false },
          { status: 404 }
        );
      }
      
      const errorText = await response.text();
      console.error("Thirdweb API error:", response.status, errorText);
      
      return NextResponse.json(
        { error: "Failed to fetch user from Thirdweb" },
        { status: response.status }
      );
    }

    const userData = await response.json();
    
    // Extract relevant information
    const userInfo = {
      userId: userData.userId,
      walletAddress: userData.walletAddress,
      email: userData.email,
      linkedAccounts: userData.linkedAccounts || [],
      profiles: [],
    };

    // Extract profile information from linked accounts
    if (userData.linkedAccounts) {
      userData.linkedAccounts.forEach((account: any) => {
        if (account.type === "google" && account.details) {
          userInfo.profiles.push({
            type: "google",
            email: account.details.email,
            name: account.details.name,
            picture: account.details.picture,
          });
        } else if (account.type === "email" && account.details) {
          userInfo.profiles.push({
            type: "email",
            email: account.details.email,
          });
        } else if (account.type === "apple" && account.details) {
          userInfo.profiles.push({
            type: "apple",
            email: account.details.email,
            name: account.details.name,
          });
        } else if (account.type === "facebook" && account.details) {
          userInfo.profiles.push({
            type: "facebook",
            email: account.details.email,
            name: account.details.name,
            picture: account.details.picture,
          });
        } else if (account.type === "x" && account.details) {
          userInfo.profiles.push({
            type: "x",
            username: account.details.username,
            name: account.details.name,
            picture: account.details.picture,
          });
        }
      });
    }

    // Get primary email (prefer from profiles, fallback to userData.email)
    let primaryEmail = userData.email;
    if (!primaryEmail && userInfo.profiles.length > 0) {
      const emailProfile = userInfo.profiles.find(p => p.email);
      primaryEmail = emailProfile?.email;
    }

    return NextResponse.json({
      userExists: true,
      userInfo: {
        ...userInfo,
        primaryEmail,
      }
    });

  } catch (error) {
    console.error("Thirdweb user info API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check if wallet is a Thirdweb in-app wallet
export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Try to fetch user details from Thirdweb
    const userInfoResponse = await fetch(
      `${req.url.split('/api')[0]}/api/auth/thirdweb-user-info?walletAddress=${walletAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (userInfoResponse.ok) {
      const data = await userInfoResponse.json();
      return NextResponse.json({
        isThirdwebWallet: true,
        userInfo: data.userInfo,
      });
    } else {
      // If user not found in Thirdweb, it's likely an external wallet
      return NextResponse.json({
        isThirdwebWallet: false,
      });
    }

  } catch (error) {
    console.error("Wallet type check error:", error);
    return NextResponse.json(
      { error: "Failed to check wallet type" },
      { status: 500 }
    );
  }
}