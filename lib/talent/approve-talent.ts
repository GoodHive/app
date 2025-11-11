import sql from "@/lib/db";

export async function approveTalent(
  userId: string,
  approvalTypes: {
    mentor: boolean;
    talent: boolean;
    recruiter: boolean;
  },
) {
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

    await sql`
      UPDATE goodhive.users
      SET 
      talent_status = CASE 
      WHEN ${approvalTypes.talent} THEN 'approved'
      ELSE 'pending'
      END,
      mentor_status = CASE 
      WHEN ${approvalTypes.mentor} THEN 'approved'
      ELSE 'pending'
      END,
      recruiter_status = CASE 
      WHEN ${approvalTypes.recruiter} THEN 'approved'
      ELSE 'pending'
      END,
      approved = CASE 
      WHEN ${approvalTypes.talent} OR ${approvalTypes.mentor} OR ${approvalTypes.recruiter} THEN true
      ELSE false
      END
      WHERE userid = ${userId}
    `;

    return new Response(
      JSON.stringify({ message: "Approved talent successfully" }),
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Unable to approve the talent" }),
      {
        status: 500,
      },
    );
  }
}
