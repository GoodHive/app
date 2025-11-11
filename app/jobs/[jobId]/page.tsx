import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JobPageHeader } from "@/app/components/job-page/JobPageHeader";
import { JobPageSidebar } from "@/app/components/job-page/JobPageSidebar";
import { JobSectionsDisplay } from "@/app/components/job-sections-display/job-sections-display";
import styles from "./page.module.scss";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  projectType: string;
  jobType: string;
  typeEngagement?: string;
  duration?: string;
  skills: string[];
  city: string;
  country: string;
  postedAt: string;
  createdAt: string;
  published: boolean;
  blockId?: number;
  blockchainJobId?: number;
  escrowAmount?: number;
  paymentTokenAddress?: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    headline?: string;
    city?: string;
    country?: string;
    email?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    walletAddress?: string;
  };
  sections: Array<{
    id: string;
    jobId: string;
    heading: string;
    content: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  relatedJobs: Array<{
    id: string;
    title: string;
    budget: number;
    currency: string;
    projectType: string;
    city: string;
    country: string;
    postedAt: string;
  }>;
  applicationCount: number;
}

async function getJob(jobId: string): Promise<Job | null> {
  try {
    // Use absolute URL for server-side fetch
    // In production, this should be your actual domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch job: ${response.status}`);
    }

    const job = await response.json();
    return job;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { jobId: string } }): Promise<Metadata> {
  const job = await getJob(params.jobId);

  if (!job) {
    return {
      title: 'Job Not Found | GoodHive',
      description: 'The requested job could not be found.',
    };
  }

  const jobLocation = job.city && job.country ? `${job.city}, ${job.country}` : job.city || job.country || 'Remote';
  const budgetText = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: job.currency === 'USDC' ? 'USD' : job.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(job.budget);

  return {
    title: `${job.title} at ${job.company.name} | GoodHive`,
    description: `${job.title} position at ${job.company.name} in ${jobLocation}. Budget: ${budgetText}. Apply now on GoodHive for Web3 and blockchain opportunities.`,
    keywords: `${job.title}, ${job.company.name}, Web3 jobs, blockchain jobs, ${jobLocation}, ${job.skills.join(', ')}`,
    openGraph: {
      title: `${job.title} at ${job.company.name}`,
      description: `${job.title} position at ${job.company.name} in ${jobLocation}. Budget: ${budgetText}.`,
      type: 'website',
      images: job.company.logo ? [{ url: job.company.logo }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${job.title} at ${job.company.name}`,
      description: `${job.title} position at ${job.company.name} in ${jobLocation}. Budget: ${budgetText}.`,
      images: job.company.logo ? [job.company.logo] : [],
    },
  };
}

export default async function JobPage({ params }: { params: { jobId: string } }) {
  const job = await getJob(params.jobId);

  // In development, allow viewing unpublished jobs for testing
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!job || (!job.published && !isDevelopment)) {
    notFound();
  }

  return (
    <div className={styles.pageContainer}>
      {/* Job Header */}
      <JobPageHeader job={job} />

      {/* Main Content */}
      <div className={styles.contentContainer}>
        <div className={styles.contentGrid}>
          {/* Job Content */}
          <main className={styles.mainContent}>
            {/* Job Sections - Modular Description */}
            {job.sections && job.sections.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Job Description</h2>
                <JobSectionsDisplay
                  sections={job.sections.map(s => ({
                    id: s.id,
                    heading: s.heading,
                    content: s.content,
                    sort_order: s.sortOrder || 0
                  }))}
                  defaultExpanded={false}
                />
              </section>
            )}

            {/* Fallback Job Description - Only show if no sections exist */}
            {job.description && (!job.sections || job.sections.length === 0) && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Job Description</h2>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </section>
            )}


            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Required Skills</h2>
                <div className={styles.skillsContainer}>
                  {job.skills.map((skill, index) => (
                    <span key={index} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Related Jobs */}
            {job.relatedJobs && job.relatedJobs.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>More Jobs from {job.company.name}</h2>
                <div className={styles.relatedJobs}>
                  {job.relatedJobs.map((relatedJob) => (
                    <a
                      key={relatedJob.id}
                      href={`/jobs/${relatedJob.id}`}
                      className={styles.relatedJobCard}
                    >
                      <h3 className={styles.relatedJobTitle}>{relatedJob.title}</h3>
                      <p className={styles.relatedJobMeta}>
                        {relatedJob.city}, {relatedJob.country} • {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: relatedJob.currency === 'USDC' ? 'USD' : relatedJob.currency,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(relatedJob.budget)}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <JobPageSidebar job={job} />
          </aside>
        </div>
      </div>
    </div>
  );
}