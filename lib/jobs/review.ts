// Price fields: editable while the job is a draft, locked once submitted.
export const COMPANY_PRICE_FIELDS = ["budget", "currency"] as const;

// Written by the blockchain flow only — never editable by the company.
export const COMPANY_BLOCKCHAIN_FIELDS = [
  "escrow_amount",
  "payment_token_address",
  "blockchain_job_id",
  "block_id",
] as const;

export const COMPANY_LOCKED_FIELDS_AFTER_SUBMIT = [
  ...COMPANY_PRICE_FIELDS,
  ...COMPANY_BLOCKCHAIN_FIELDS,
] as const;

// Fixed on-chain once a job is live (chain, payment token, service flags),
// so the company can no longer change them. Budget is DB-only and stays
// editable on a live job.
export const COMPANY_LIVE_LOCKED_JOB_FIELDS = [
  "chain",
  "currency",
  "talent",
  "recruiter",
  "mentor",
] as const;

export const COMPANY_ALWAYS_LOCKED_JOB_FIELDS = [
  ...COMPANY_BLOCKCHAIN_FIELDS,
  "published",
  "review_status",
  "admin_feedback",
  "reviewed_at",
  "reviewed_by",
] as const;

export type JobReviewStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "active"
  | "closed";

export function resolveJobReviewStatus(
  value: unknown,
  published?: boolean | null,
): JobReviewStatus {
  if (typeof value === "string" && value.length > 0) {
    return value as JobReviewStatus;
  }

  return published ? "approved" : "draft";
}
