import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParamsEntries = request.nextUrl.searchParams.entries();
  const searchParams = Object.fromEntries(searchParamsEntries);

  const { userId } = searchParams;

  if (!userId) {
    return new Response(
      JSON.stringify({ message: "Missing userId parameter" }),
      {
        status: 400,
      },
    );
  }

  try {
    // Get all jobs for the company
    const jobsQuery = await sql`
      SELECT *
      FROM goodhive.job_offers
      WHERE user_id = ${userId}
    `;

    // Helper function to normalize budget values that might be in wei format
    const normalizeBudget = (budget: any): number => {
      if (!budget) return 0;

      const budgetNum = typeof budget === 'string' ? parseFloat(budget) : Number(budget);

      // If budget is extremely large (likely in wei format), convert to dollars
      // Wei format typically has 18 decimals, but USDC has 6 decimals
      if (budgetNum > 1000000000000) { // More than 1 trillion = likely wei format
        // Assume USDC format (6 decimals) for most job budgets
        return budgetNum / 1000000; // Convert from micro-units to dollars
      }

      return budgetNum;
    };

    const jobs = jobsQuery.map((item) => ({
      id: item.id,
      title: item.title,
      companyName: item.company_name,
      typeEngagement: item.type_engagement,
      description: item.description,
      duration: item.duration,
      budget: normalizeBudget(item.budget),
      projectType: item.project_type,
      skills: item.skills?.split(",") || [],
      country: item.country,
      city: item.city,
      chain: item.chain,
      jobType: item.job_type,
      image_url: item.image_url,
      walletAddress: item.wallet_address,
      escrowAmount: parseFloat(item.escrow_amount) || 0,
      mentor: item.mentor === "true" || item.mentor === true,
      recruiter: item.recruiter === "true" || item.recruiter === true,
      talent: item.talent === "true" || item.talent === true,
      postedAt: item.posted_at,
      block_id: item.block_id,
      currency: item.currency || 'USDC',
    }));

    // Calculate statistics
    const totalJobs = jobs.length;
    const publishedJobs = jobs.filter(job => job.block_id).length;
    const draftJobs = jobs.filter(job => !job.block_id).length;
    const fundedJobs = jobs.filter(job => job.escrowAmount > 0).length;

    // Calculate total funding across all jobs
    const totalFunded = jobs.reduce((sum, job) => sum + job.escrowAmount, 0);

    // Get recent jobs (last 5)
    const recentJobs = jobs
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      .slice(0, 5);

    // Job status distribution
    const statusDistribution = {
      draft: draftJobs,
      published: publishedJobs - fundedJobs, // Published but not funded
      funded: fundedJobs,
    };

    // Calculate blockchain distribution
    const chainDistribution = jobs.reduce((acc, job) => {
      const chain = job.chain || 'unknown';
      acc[chain] = (acc[chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average job budget
    const averageBudget = jobs.length > 0
      ? jobs.reduce((sum, job) => sum + job.budget, 0) / jobs.length
      : 0;

    // Skills analysis
    const skillsMap = new Map<string, number>();
    jobs.forEach(job => {
      job.skills.forEach(skill => {
        const trimmedSkill = skill.trim();
        if (trimmedSkill) {
          skillsMap.set(trimmedSkill, (skillsMap.get(trimmedSkill) || 0) + 1);
        }
      });
    });

    const mostUsedSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Duration analysis
    const durationDistribution = jobs.reduce((acc, job) => {
      const duration = job.duration || 'unknown';
      acc[duration] = (acc[duration] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Job type analysis
    const jobTypeDistribution = jobs.reduce((acc, job) => {
      const type = job.jobType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Engagement type analysis
    const engagementDistribution = jobs.reduce((acc, job) => {
      const engagement = job.typeEngagement || 'unknown';
      acc[engagement] = (acc[engagement] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Performance metrics (placeholders for now)
    const performanceMetrics = {
      totalViews: 0, // TODO: Implement job views tracking
      totalApplications: 0, // TODO: Implement applications tracking
      conversionRate: 0, // applications / views
      averageTimeToHire: 0, // TODO: Implement hiring tracking
    };

    const dashboardStats = {
      overview: {
        totalJobs,
        publishedJobs,
        draftJobs,
        fundedJobs,
        totalFunded: totalFunded.toFixed(2),
        averageBudget: averageBudget.toFixed(2),
      },
      statusDistribution,
      chainDistribution,
      durationDistribution,
      jobTypeDistribution,
      engagementDistribution,
      performanceMetrics,
      recentJobs,
      insights: {
        mostUsedSkills,
        topPerformingJobs: [], // TODO: Rank jobs by applications/views
        fundingEfficiency: 0, // TODO: Calculate funding vs hiring success
        totalBudget: jobs.reduce((sum, job) => sum + job.budget, 0),
        skillsCount: skillsMap.size,
        averageJobsPerMonth: totalJobs > 0 ? (totalJobs / Math.max(1,
          Math.ceil((new Date().getTime() - new Date(Math.min(...jobs.map(j => new Date(j.postedAt).getTime()))).getTime()) / (1000 * 60 * 60 * 24 * 30))
        )).toFixed(1) : 0,
      }
    };

    return new Response(JSON.stringify(dashboardStats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Error retrieving dashboard stats:", error);
    return new Response(
      JSON.stringify({
        message: "Error retrieving dashboard stats",
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}