import sql from "@/lib/db";

export async function POST(request: Request) {
  const { userId, approvalTypes, referral_code } = await request.json();

    try {
    await sql`
      UPDATE goodhive.talents
      SET
        approved = true,
        talent = ${approvalTypes.talent},
        mentor = ${approvalTypes.mentor},
        recruiter = ${approvalTypes.recruiter},
        inReview = false
      WHERE user_id = ${userId}
    `;

    const updatedUser = await sql`
      UPDATE goodhive.users
      SET 
      talent_status = CASE 
      WHEN ${approvalTypes.talent} IS TRUE THEN 'approved'
      WHEN ${approvalTypes.talent} IS FALSE THEN 'pending'
      ELSE talent_status  -- Preserve existing status if not explicitly set
      END,
      mentor_status = CASE 
      WHEN ${approvalTypes.mentor} IS TRUE THEN 'approved'
      WHEN ${approvalTypes.mentor} IS FALSE THEN 'pending'
      ELSE mentor_status
      END,
      recruiter_status = CASE 
      WHEN ${approvalTypes.recruiter} IS TRUE THEN 'approved'
      WHEN ${approvalTypes.recruiter} IS FALSE THEN 'pending'
      ELSE recruiter_status
      END
      WHERE userid = ${userId}
      RETURNING *;
    `;

    // Handle adding roles to approved_roles array dynamically
    const roles = ["talent", "mentor", "recruiter"];
    for (const role of roles) {
      if (
        approvalTypes[role] &&
        !updatedUser[0]?.approved_roles?.some((r: any) => r.role === role)
      ) {
        await sql`
        UPDATE goodhive.users
        SET approved_roles = array_append(approved_roles, jsonb_build_object('role', ${role}::TEXT, 'approval_time', CURRENT_TIMESTAMP))
        WHERE userid = ${userId};
      `;
      }
    }

    // Update referral table to add the approved talent
    if (referral_code)
      await sql`
      UPDATE goodhive.referrals
      SET approved_talents = array_append(approved_talents, ${userId})
      WHERE referral_code = ${referral_code};
    `;

    return new Response(
      JSON.stringify({ message: "Approved talent successfully" }),
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}
