import sql from "@/lib/db";

export async function getProfileData(userId: string) {
  if (!userId) {
    return {};
  }

  try {
    const talent = await sql`
      SELECT * 
      FROM goodhive.talents 
      WHERE user_id = ${userId};
    `;

    if (talent.length === 0) {
      return {};
    }

    // Search For User
    const user = await sql`
      SELECT * 
      FROM goodhive.users 
      WHERE userid = ${userId};
    `;

    if (user.length === 0) {
      return {};
    }

    const profileUser = user[0];

    const getStatus = (status: string, isActive: boolean) => {
      return isActive ? status : "pending";
    };

    // Helper function to safely decode base64 or return original string
    const safeBase64Decode = (value: string | null | undefined): string => {
      if (!value) return "";

      try {
        // Check if the string looks like base64 (contains only base64 characters)
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (base64Regex.test(value)) {
          return Buffer.from(value, "base64").toString("utf-8");
        }
        // If it doesn't look like base64, return as is
        return value;
      } catch (error) {
        console.error("Error decoding base64:", error);
        return value || "";
      }
    };

    const talentData = {
      ...talent[0],
      description: safeBase64Decode(talent[0].description),
      about_work: safeBase64Decode(talent[0].about_work),
      talent_status: getStatus(profileUser.talent_status, talent[0].talent),
      mentor_status: getStatus(profileUser.mentor_status, talent[0].mentor),
      recruiter_status: getStatus(
        profileUser.recruiter_status,
        talent[0].recruiter,
      ),
      talent_approved: profileUser.talent_status === "approved" ? true : false,
    };

    return talentData;
  } catch (error) {
    console.log("Error retrieving data:", error);
    throw new Error("Failed to fetch data from the server");
  }
}
