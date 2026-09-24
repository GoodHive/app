import { NextRequest, NextResponse } from "next/server";

import { readViewerAccess } from "@/lib/auth/api-guards";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import sql from "@/lib/db";
import {
  normalizeJobDescriptionForDisplay,
  normalizeJobSectionsForStorage,
} from "@/lib/jobs/format-job-content";
import {
  COMPANY_ALWAYS_LOCKED_JOB_FIELDS,
  COMPANY_LIVE_LOCKED_JOB_FIELDS,
  COMPANY_PRICE_FIELDS,
  type JobReviewStatus,
  resolveJobReviewStatus,
} from "@/lib/jobs/review";

const PATCH_FIELD_MAP: Record<string, string> = {
  blockId: "block_id",
  blockchainJobId: "blockchain_job_id",
  companyName: "company_name",
  escrowAmount: "escrow_amount",
  imageUrl: "image_url",
  jobType: "job_type",
  paymentTokenAddress: "payment_token_address",
  projectType: "project_type",
  typeEngagement: "type_engagement",
  walletAddress: "wallet_address",
};

const COMPANY_EDITABLE_JOB_FIELDS = new Set([
  "chain",
  "city",
  "company_name",
  "country",
  "description",
  "duration",
  "image_url",
  "in_saving_stage",
  "job_type",
  "mentor",
  "project_type",
  "recruiter",
  "skills",
  "talent",
  "title",
  "type_engagement",
  "wallet_address",
]);

type CurrentJobValues = Record<
  PriceField | (typeof COMPANY_LIVE_LOCKED_JOB_FIELDS)[number],
  unknown
>;

type PriceField = (typeof COMPANY_PRICE_FIELDS)[number];

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function normalizePatchPayload(
  payload: Record<string, unknown>,
  reviewStatus: JobReviewStatus,
  current: CurrentJobValues,
) {
  const isLive = reviewStatus === "active";
  const lockedFields = new Set<string>();
  const updateFields: Record<string, unknown> = {};

  // The form re-sends every field on each save, so a locked field is only
  // rejected when its value actually changes.
  const isUnchanged = (field: keyof CurrentJobValues, value: unknown) =>
    typeof current[field] === "boolean"
      ? current[field] === toBoolean(value)
      : String(value ?? "") === String(current[field] ?? "");

  for (const [rawKey, rawValue] of Object.entries(payload)) {
    if (rawValue === undefined || rawKey === "sections") {
      continue;
    }

    const normalizedKey = PATCH_FIELD_MAP[rawKey] ?? rawKey;

    if (COMPANY_ALWAYS_LOCKED_JOB_FIELDS.includes(normalizedKey as never)) {
      lockedFields.add(normalizedKey);
      continue;
    }

    // A live job is never moved back into the saving stage by an edit.
    if (isLive && normalizedKey === "in_saving_stage") {
      continue;
    }

    // Price is editable on drafts and locked once submitted. A live job may
    // still change its budget (DB-only), but not its on-chain currency.
    if (COMPANY_PRICE_FIELDS.includes(normalizedKey as never)) {
      const field = normalizedKey as PriceField;
      const isEditable =
        reviewStatus === "draft" || (isLive && field === "budget");
      if (isEditable) {
        updateFields[field] = rawValue;
      } else if (!isUnchanged(field, rawValue)) {
        lockedFields.add(field);
      }
      continue;
    }

    if (
      isLive &&
      COMPANY_LIVE_LOCKED_JOB_FIELDS.includes(normalizedKey as never)
    ) {
      const field = normalizedKey as keyof CurrentJobValues;
      if (!isUnchanged(field, rawValue)) {
        lockedFields.add(field);
      }
      continue;
    }

    if (!COMPANY_EDITABLE_JOB_FIELDS.has(normalizedKey)) {
      continue;
    }

    if (normalizedKey === "skills" && Array.isArray(rawValue)) {
      updateFields[normalizedKey] = rawValue.join(", ");
      continue;
    }

    updateFields[normalizedKey] = rawValue;
  }

  return {
    lockedFields: Array.from(lockedFields),
    updateFields,
  };
}

async function fetchJob(jobId: string) {
  const rows = await sql`
    SELECT
      jo.*,
      c.designation AS company_name,
      c.image_url AS company_logo,
      c.headline,
      c.city AS company_city,
      c.country AS company_country,
      c.email AS company_email,
      c.linkedin,
      c.twitter,
      c.portfolio,
      c.wallet_address AS company_wallet_address
    FROM goodhive.job_offers jo
    LEFT JOIN goodhive.companies c ON jo.user_id = c.user_id
    WHERE jo.id = ${jobId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;

  if (!jobId) {
    return NextResponse.json({ message: "Missing job ID" }, { status: 404 });
  }

  try {
    const jobData = await fetchJob(jobId);

    if (!jobData || jobData.published !== true) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // Company identity is confidential: only admins, approved talents,
    // approved companies, and the job owner may see it.
    const access = await readViewerAccess();
    const canViewCompany =
      access.canViewConfidentialInfo || access.userId === jobData.user_id;

    const sectionsQuery = await sql`
      SELECT id, heading, content, sort_order, created_at, updated_at
      FROM goodhive.job_sections
      WHERE job_id = ${jobId}
      ORDER BY sort_order ASC
    `;

    const relatedJobsQuery = await sql`
      SELECT id, title, budget, currency, project_type, city, country, posted_at
      FROM goodhive.job_offers
      WHERE user_id = ${jobData.user_id}
        AND id != ${jobId}
        AND published = true
      ORDER BY posted_at DESC
      LIMIT 3
    `;

    const applicationCountQuery = await sql`
      SELECT COUNT(*) AS application_count
      FROM goodhive.job_applications
      WHERE job_id = ${jobId}
    `.catch(() => [{ application_count: 0 }]);

    const job = {
      id: jobData.id,
      title: jobData.title,
      description: jobData.description,
      budget: jobData.budget,
      currency: jobData.currency,
      projectType: jobData.project_type,
      jobType: jobData.job_type,
      typeEngagement: jobData.type_engagement,
      duration: jobData.duration,
      talent: jobData.talent === true || jobData.talent === "true",
      mentor: jobData.mentor === true || jobData.mentor === "true",
      recruiter: jobData.recruiter === true || jobData.recruiter === "true",
      skills: jobData.skills
        ? jobData.skills.split(",").map((skill: string) => skill.trim())
        : [],
      city: jobData.city,
      country: jobData.country,
      postedAt: jobData.posted_at,
      createdAt: jobData.posted_at,
      published: jobData.published,
      reviewStatus: resolveJobReviewStatus(jobData.review_status, jobData.published),
      adminFeedback: jobData.admin_feedback ?? null,
      blockId: jobData.block_id,
      blockchainJobId: jobData.blockchain_job_id,
      escrowAmount: jobData.escrow_amount,
      paymentTokenAddress: jobData.payment_token_address,
      company: canViewCompany
        ? {
            id: jobData.user_id,
            name: jobData.company_name || jobData.designation,
            logo: jobData.company_logo,
            headline: jobData.headline,
            city: jobData.company_city,
            country: jobData.company_country,
            email: jobData.company_email,
            linkedin: jobData.linkedin,
            twitter: jobData.twitter,
            website: jobData.portfolio || null,
            walletAddress: jobData.company_wallet_address || null,
          }
        : {
            id: null,
            name: null,
            logo: null,
            headline: null,
            city: null,
            country: null,
            email: null,
            linkedin: null,
            twitter: null,
            website: null,
            walletAddress: null,
            locked: true,
          },
      sections: sectionsQuery.map((section) => ({
        id: section.id.toString(),
        jobId,
        heading: section.heading,
        content: section.content,
        sortOrder: section.sort_order,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      })),
      relatedJobs: relatedJobsQuery.map((job) => ({
        id: job.id,
        title: job.title,
        budget: job.budget,
        currency: job.currency,
        projectType: job.project_type,
        city: job.city,
        country: job.country,
        postedAt: job.posted_at,
      })),
      applicationCount: Number(applicationCountQuery[0]?.application_count || 0),
    };

    // Never shared-cache: the payload varies by viewer entitlement.
    return NextResponse.json(job, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    console.error("Error fetching job data:", error);
    return NextResponse.json(
      { message: "Error retrieving job data" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;

  try {
    const sessionUser = await getSessionUser();
    const actorUserId = sessionUser?.user_id ?? null;
    if (!actorUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const jobRows = await sql<{
      id: string;
      budget: string | null;
      chain: string | null;
      currency: string | null;
      mentor: boolean | string | null;
      published: boolean | null;
      recruiter: boolean | string | null;
      review_status: string | null;
      talent: boolean | string | null;
      user_id: string;
    }[]>`
      SELECT
        id, user_id, review_status, published, budget, currency,
        chain, talent, recruiter, mentor
      FROM goodhive.job_offers
      WHERE id = ${jobId}::uuid
      LIMIT 1
    `;

    const job = jobRows[0];
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    if (job.user_id !== actorUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const reviewStatus = resolveJobReviewStatus(job.review_status, job.published);
    if (
      reviewStatus !== "draft" &&
      reviewStatus !== "rejected" &&
      reviewStatus !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Job cannot be edited while under review, approved, or closed. Contact admin.",
        },
        { status: 403 },
      );
    }

    const { lockedFields, updateFields } = normalizePatchPayload(
      body,
      reviewStatus,
      {
        budget: job.budget,
        chain: job.chain,
        currency: job.currency,
        mentor: toBoolean(job.mentor),
        recruiter: toBoolean(job.recruiter),
        talent: toBoolean(job.talent),
      },
    );
    if (lockedFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `These fields cannot be edited by the company: ${lockedFields.join(", ")}`,
        },
        { status: 403 },
      );
    }

    if (typeof updateFields.description === "string") {
      updateFields.description = normalizeJobDescriptionForDisplay(
        updateFields.description,
      );
    }

    let normalizedSections: Awaited<
      ReturnType<typeof normalizeJobSectionsForStorage>
    >["sections"] = [];

    if (Array.isArray(body.sections)) {
      const incomingSections = body.sections
        .map((section, index) => {
          const heading =
            typeof section?.heading === "string" ? section.heading.trim() : "";
          const content =
            typeof section?.content === "string" ? section.content.trim() : "";

          if (!heading || !content) {
            return null;
          }

          return {
            heading,
            content,
            sort_order:
              typeof section.sort_order === "number" ? section.sort_order : index,
          };
        })
        .filter(Boolean) as Array<{
        heading: string;
        content: string;
        sort_order: number;
      }>;

      const formattedSections = await normalizeJobSectionsForStorage(
        incomingSections,
        typeof body.title === "string" ? body.title : undefined,
      );

      normalizedSections = formattedSections.sections;
      updateFields.description = formattedSections.descriptionHtml;
    }

    const updateEntries = Object.entries(updateFields);
    if (updateEntries.length > 0) {
      const values = updateEntries.map(([, value]) => value);
      const updateSet = updateEntries
        .map(([column], index) => `${column} = $${index + 1}`)
        .join(", ");
      const queryValues = [...values, jobId].map(
        (value) => value as string | number | boolean | null,
      );

      await sql.unsafe(
        `
          UPDATE goodhive.job_offers
          SET ${updateSet}
          WHERE id = $${updateEntries.length + 1}
        `,
        queryValues,
      );
    }

    if (Array.isArray(body.sections)) {
      await sql`
        DELETE FROM goodhive.job_sections
        WHERE job_id = ${jobId}::uuid
      `;

      for (let index = 0; index < normalizedSections.length; index += 1) {
        const section = normalizedSections[index];
        await sql`
          INSERT INTO goodhive.job_sections (
            job_id,
            heading,
            content,
            sort_order
          ) VALUES (
            ${jobId}::uuid,
            ${section.heading},
            ${section.content},
            ${typeof section.sort_order === "number" ? section.sort_order : index}
          )
        `;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId,
          review_status: reviewStatus,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update job" },
      { status: 500 },
    );
  }
}
