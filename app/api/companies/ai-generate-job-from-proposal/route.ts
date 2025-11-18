import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Skills database for validation and suggestions
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
  "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "HTML", "CSS", "SASS", "SCSS",
  "Vue.js", "Angular", "Next.js", "Express.js", "Django", "Flask", "Ruby on Rails",
  "Spring", "Laravel", "ASP.NET", "MongoDB", "PostgreSQL", "MySQL", "Redis",
  "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Git", "GitHub",
  "GitLab", "CI/CD", "Jenkins", "Terraform", "Ansible", "Linux", "Ubuntu",
  "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch", "Pandas",
  "NumPy", "Scikit-learn", "Blockchain", "Ethereum", "Solidity", "Web3",
  "Smart Contracts", "DeFi", "NFT", "Cryptocurrency", "REST API", "GraphQL",
  "Microservices", "Agile", "Scrum", "UI/UX Design", "Figma", "Adobe Creative Suite"
];

interface JobProposalRequest {
  jobProposal: string;
}

interface JobSection {
  heading: string;
  content: string;
  sort_order: number;
}

interface GeneratedJobData {
  title: string;
  sections: JobSection[];
  skills: string[];
  projectType: 'fixed' | 'hourly';
  typeEngagement: 'freelance' | 'remote' | 'any';
  duration: string;
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { jobProposal }: JobProposalRequest = await request.json();

    // Validation
    if (!jobProposal || !jobProposal.trim()) {
      return NextResponse.json(
        { message: "Job proposal is required" },
        { status: 400 }
      );
    }

    if (jobProposal.length < 100) {
      return NextResponse.json(
        { message: "Job proposal must be at least 100 characters" },
        { status: 400 }
      );
    }

    if (jobProposal.length > 5000) {
      return NextResponse.json(
        { message: "Job proposal must not exceed 5000 characters" },
        { status: 400 }
      );
    }

    // Construct comprehensive prompt for parsing job proposal
    const jobGenerationPrompt = `
You are an expert HR professional and job posting specialist. You have been given a job proposal that may be in various formats (formal, casual, bullet points, paragraphs, etc.). Your task is to analyze this proposal and extract all relevant information to create a comprehensive, professional job posting.

**Job Proposal:**
${jobProposal}

**Your task is to:**

1. **Extract or Infer Job Title:** Create a professional job title that accurately reflects the role. If not explicitly stated, infer it from the job description.

2. **Create Comprehensive Job Sections:** Organize the information into 4-6 detailed sections with professional content:
   - About the Role (150-200 words) - Overview of the position
   - Key Responsibilities (4-6 bullet points) - Main duties and tasks
   - Requirements & Qualifications (4-6 bullet points) - Must-have skills and experience
   - Preferred Skills (3-4 bullet points) - Nice-to-have qualifications
   - What We Offer (3-4 bullet points) - Benefits and perks (infer if not mentioned)
   - About the Company (optional, 100-150 words if relevant information is provided)

3. **Extract Skills:** Identify 8-12 relevant technical skills mentioned or implied in the proposal. Include programming languages, frameworks, tools, and technologies.

4. **Determine Project Details:**
   - **Project Type:** Analyze if this is a fixed-price project or hourly engagement (default to "fixed" if unclear)
   - **Engagement Type:** Determine if this is freelance, remote employment, or flexible (default to "freelance" if unclear)
   - **Duration:** Estimate project duration based on scope:
     - "lessThanSevenDays" - Quick tasks
     - "moreThanSevenDays" - Short projects (1-2 weeks)
     - "moreThanOneMonth" - Medium projects (1-3 months)
     - "moreThanThreeMonths" - Long-term projects (3+ months)
   - **Job Type:** Determine if remote, hybrid, or onsite (default to "remote" if unclear)

5. **Estimate Budget:** If budget is mentioned, extract it. If not mentioned, provide a reasonable estimate based on:
   - Scope of work
   - Required experience level
   - Project complexity
   - Industry standards

**Guidelines:**
- Use professional, engaging language
- Expand brief descriptions into comprehensive content
- If information is missing, make reasonable inferences based on context
- Use HTML formatting for rich text (paragraphs, lists, bold text)
- Ensure all sections are substantial and informative
- Focus on value proposition and growth opportunities
- Be inclusive and welcoming in tone

**Response Format:**
Return a JSON object with this exact structure:
{
  "title": "Professional job title (max 60 characters)",
  "sections": [
    {
      "heading": "Section Name",
      "content": "HTML formatted content with <p>, <ul>, <li>, <strong> tags",
      "sort_order": 0
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projectType": "fixed" or "hourly",
  "typeEngagement": "freelance" or "remote" or "any",
  "duration": "lessThanSevenDays" or "moreThanSevenDays" or "moreThanOneMonth" or "moreThanThreeMonths",
  "estimatedBudget": {
    "min": number,
    "max": number,
    "currency": "USD"
  },
  "jobType": "remote" or "hybrid" or "onsite"
}

**Important:** Only return the JSON object, no additional text or markdown formatting.
`;

    // Generate job data using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional who creates exceptional job postings from unstructured proposals. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: jobGenerationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from AI service");
    }

    // Parse AI response
    let generatedData: GeneratedJobData;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      generatedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("AI response parsing error:", parseError);
      console.error("AI response:", aiResponse);
      throw new Error("Failed to parse AI response");
    }

    // Validate and sanitize the generated data
    if (!generatedData.title || !generatedData.sections || !Array.isArray(generatedData.sections)) {
      throw new Error("Invalid AI response structure");
    }

    // Validate skills against our database and clean them
    const validatedSkills = generatedData.skills
      ?.filter(skill => typeof skill === 'string' && skill.length > 0)
      .slice(0, 15) // Limit to 15 skills max
      .map(skill => {
        // Try to find exact matches in our skill database
        const exactMatch = COMMON_SKILLS.find(s => s.toLowerCase() === skill.toLowerCase());
        return exactMatch || skill.trim();
      })
      .filter(skill => skill.length > 1)
      || [];

    // Ensure sections have proper sort_order
    const validatedSections = generatedData.sections
      .filter(section => section.heading && section.content)
      .map((section, index) => ({
        ...section,
        sort_order: index
      }));

    // Set reasonable defaults for budget if not provided or invalid
    let estimatedBudget = generatedData.estimatedBudget;
    if (!estimatedBudget || !estimatedBudget.min || !estimatedBudget.max) {
      // Default budget based on typical project
      estimatedBudget = {
        min: 1500,
        max: 5000,
        currency: "USD"
      };
    }

    const responseData: GeneratedJobData = {
      title: generatedData.title.substring(0, 100), // Ensure title length limit
      sections: validatedSections,
      skills: validatedSkills,
      projectType: generatedData.projectType === 'hourly' ? 'hourly' : 'fixed',
      typeEngagement: ['freelance', 'remote', 'any'].includes(generatedData.typeEngagement)
        ? generatedData.typeEngagement
        : 'freelance',
      duration: ['lessThanSevenDays', 'moreThanSevenDays', 'moreThanOneMonth', 'moreThanThreeMonths']
        .includes(generatedData.duration)
        ? generatedData.duration
        : 'moreThanOneMonth',
      estimatedBudget,
      jobType: ['remote', 'hybrid', 'onsite'].includes(generatedData.jobType)
        ? generatedData.jobType
        : 'remote'
    };

    return NextResponse.json({
      status: "success",
      data: responseData
    });

  } catch (error) {
    console.error("Error generating job from proposal:", error);

    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { status: "error", message: "AI service configuration error" },
          { status: 500 }
        );
      }
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        return NextResponse.json(
          { status: "error", message: "AI service temporarily unavailable. Please try again in a few minutes." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to generate job posting from proposal. Please try again or use the Quick Input method."
      },
      { status: 500 }
    );
  }
}

