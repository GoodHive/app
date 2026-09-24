"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Clock3, ExternalLink, FileStack, Pencil, Plus, Send, Users, Zap } from "lucide-react";
import toast from "react-hot-toast";

import { JobApplicationsDrawer } from "@/app/components/applications";
import { AssignTalentModal } from "@/app/components/AssignTalentModal";
import { BlockchainActivateModal } from "@/app/components/BlockchainActivateModal";
import type { CompanyDashboardJob } from "@/lib/jobs/company-jobs";

interface JobsManagementClientProps {
  companyUserId: string;
  initialJobs: CompanyDashboardJob[];
  initialOpenJobId?: string | null;
}

const REVIEW_STATUS_META: Record<
  CompanyDashboardJob["reviewStatus"],
  { badgeClassName: string; label: string }
> = {
  active: {
    badgeClassName: "bg-sky-100 text-sky-700 border border-sky-200",
    label: "Active",
  },
  approved: {
    badgeClassName: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    label: "Approved",
  },
  closed: {
    badgeClassName: "bg-slate-200 text-slate-700 border border-slate-300",
    label: "Closed",
  },
  draft: {
    badgeClassName: "bg-slate-100 text-slate-700 border border-slate-200",
    label: "Draft",
  },
  pending_review: {
    badgeClassName: "bg-amber-100 text-amber-700 border border-amber-200",
    label: "Pending Review",
  },
  rejected: {
    badgeClassName: "bg-rose-100 text-rose-700 border border-rose-200",
    label: "Rejected",
  },
};

function formatPostedDate(value: string | null) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getPrimaryAction(job: CompanyDashboardJob) {
  if (job.reviewStatus === "draft" || job.reviewStatus === "rejected") {
    return {
      href: `/companies/create-job?id=${job.id}`,
      label: "Edit",
      type: "link" as const,
    };
  }

  if (job.reviewStatus === "active") {
    return {
      href: `/jobs/${job.id}`,
      label: "View Live",
      type: "link" as const,
    };
  }

  // Approved — payment token not set means step 1 (blockchain publish) not done
  if (job.reviewStatus === "approved" && !job.paymentTokenAddress) {
    return {
      label: "Publish to Blockchain",
      type: "blockchain" as const,
    };
  }

  // Approved + token set means blockchain-published, but not yet funded/activated
  if (job.reviewStatus === "approved" && job.paymentTokenAddress) {
    return {
      label: "Add Provision Fund",
      type: "blockchain" as const,
    };
  }

  return {
    disabled: true,
    label: "Awaiting Review",
    type: "button" as const,
  };
}

export default function JobsManagementClient({
  companyUserId,
  initialJobs,
  initialOpenJobId = null,
}: JobsManagementClientProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isSubmittingJobId, setIsSubmittingJobId] = useState<string | null>(null);
  const [isClosingJobId, setIsClosingJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [assignJobId, setAssignJobId] = useState<string | null>(null);
  const [activateJobId, setActivateJobId] = useState<string | null>(null);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    if (!initialOpenJobId) {
      return;
    }

    const matchingJob = initialJobs.find((job) => job.id === initialOpenJobId);
    if (matchingJob) {
      setSelectedJobId(matchingJob.id);
    }
  }, [initialJobs, initialOpenJobId]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const jobCounts = useMemo(
    () => ({
      draft: jobs.filter((job) => job.reviewStatus === "draft").length,
      live: jobs.filter(
        (job) => job.reviewStatus === "approved" || job.reviewStatus === "active",
      ).length,
      pending: jobs.filter((job) => job.reviewStatus === "pending_review").length,
    }),
    [jobs],
  );

  const handleSubmitForReview = async (job: CompanyDashboardJob) => {
    setIsSubmittingJobId(job.id);

    try {
      const response = await fetch(`/api/jobs/${job.id}/submit-review`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Failed to submit job for review");
      }

      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? {
                ...currentJob,
                adminFeedback: null,
                reviewStatus: "pending_review",
              }
            : currentJob,
        ),
      );
      toast.success("Job submitted for review");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit job for review",
      );
    } finally {
      setIsSubmittingJobId(null);
    }
  };

  const handleCloseJob = async (job: CompanyDashboardJob) => {
    if (!window.confirm(`Close "${job.title}"? It will be unpublished and no longer visible to talents.`)) return;
    setIsClosingJobId(job.id);
    try {
      const response = await fetch(`/api/jobs/${job.id}/close`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to close job");
      }
      setJobs((currentJobs) =>
        currentJobs.map((j) =>
          j.id === job.id ? { ...j, reviewStatus: "closed" } : j,
        ),
      );
      toast.success("Job closed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to close job");
    } finally {
      setIsClosingJobId(null);
    }
  };

  return (
    <>
      <div className="space-y-6 pb-8">
        <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-[#fff6d9] via-white to-[#fff0c0] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                Company Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                My Jobs
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Track review status, applications, and the next step for every role you
                have posted on GoodHive.
              </p>
            </div>

            <Link
              href="/companies/create-job"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              Create New Job
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-sm text-slate-500">Drafts</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {jobCounts.draft}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-sm text-slate-500">Awaiting review</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {jobCounts.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-sm text-slate-500">Live jobs</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {jobCounts.live}
              </p>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Briefcase className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
              You haven&apos;t posted any jobs yet.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first job to start collecting applicants and move it
              through review.
            </p>
            <Link
              href="/companies/create-job"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Create your first job
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,2fr)_180px_140px_140px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
              <span>Job Title</span>
              <span>Review Status</span>
              <span>Applications</span>
              <span>Assignments</span>
              <span>Posted Date</span>
            </div>

            <div className="divide-y divide-slate-200">
              {jobs.map((job) => {
                const primaryAction = getPrimaryAction(job);
                const canSubmit =
                  job.reviewStatus === "draft" || job.reviewStatus === "rejected";
                const statusMeta = REVIEW_STATUS_META[job.reviewStatus];

                return (
                  <div key={job.id} className="px-6 py-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_180px_140px_140px_140px] lg:items-start">
                      <div>
                        <Link
                          href={`/companies/create-job?id=${job.id}`}
                          className="text-lg font-semibold text-slate-900 transition hover:text-amber-700"
                        >
                          {job.title}
                        </Link>
                        {job.adminFeedback && job.reviewStatus === "rejected" ? (
                          <p className="mt-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            Admin feedback: {job.adminFeedback}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>{job.applicationCount}</span>
                        </div>
                      </div>

                      <div className="text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <FileStack className="h-4 w-4 text-slate-400" />
                          <span>{job.assignmentCount}</span>
                        </div>
                      </div>

                      <div className="text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          <span>{formatPostedDate(job.postedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {primaryAction.type === "link" ? (
                        <a
                          href={primaryAction.href}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {primaryAction.label}
                        </a>
                      ) : primaryAction.type === "blockchain" ? (
                        <button
                          type="button"
                          onClick={() => setActivateJobId(job.id)}
                          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                          <Zap className="h-4 w-4" />
                          {primaryAction.label}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                        >
                          <Clock3 className="h-4 w-4" />
                          {primaryAction.label}
                        </button>
                      )}

                      {job.reviewStatus === "active" ? (
                        <Link
                          href={`/companies/create-job?id=${job.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit & Manage Funds
                        </Link>
                      ) : null}

                      {canSubmit ? (
                        <button
                          type="button"
                          onClick={() => void handleSubmitForReview(job)}
                          disabled={isSubmittingJobId === job.id}
                          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                        >
                          <Send className="h-4 w-4" />
                          {isSubmittingJobId === job.id
                            ? "Submitting..."
                            : job.reviewStatus === "rejected"
                              ? "Resubmit for Review"
                              : "Submit for Review"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                      >
                        <Users className="h-4 w-4" />
                        View Applicants
                      </button>

                      {(job.reviewStatus === "approved" || job.reviewStatus === "active") ? (
                        <button
                          type="button"
                          onClick={() => setAssignJobId(job.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        >
                          <FileStack className="h-4 w-4" />
                          Manage Assignments
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                        >
                          <FileStack className="h-4 w-4" />
                          Manage Assignments
                        </button>
                      )}

                      {job.reviewStatus !== "closed" && job.reviewStatus !== "draft" ? (
                        <button
                          type="button"
                          onClick={() => void handleCloseJob(job)}
                          disabled={isClosingJobId === job.id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isClosingJobId === job.id ? "Closing..." : "Close Job"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {assignJobId && (
        <AssignTalentModal
          jobId={assignJobId}
          jobTitle={jobs.find((j) => j.id === assignJobId)?.title ?? ""}
          isOpen={Boolean(assignJobId)}
          onClose={() => setAssignJobId(null)}
        />
      )}

      {selectedJob ? (
        <JobApplicationsDrawer
          applicationCount={selectedJob.applicationCount}
          companyUserId={companyUserId}
          isOpen={Boolean(selectedJob)}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          onClose={() => setSelectedJobId(null)}
        />
      ) : null}

      {activateJobId !== null && (() => {
        const activateJob = jobs.find((j) => j.id === activateJobId);
        if (!activateJob) return null;
        return (
          <BlockchainActivateModal
            isOpen
            job={activateJob}
            onClose={() => setActivateJobId(null)}
            onActivated={(jobId) => {
              setJobs((current) =>
                current.map((j) =>
                  j.id === jobId ? { ...j, reviewStatus: "active", published: true } : j,
                ),
              );
              setActivateJobId(null);
            }}
          />
        );
      })()}
    </>
  );
}
