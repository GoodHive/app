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

interface JobGenerationRequest {
  jobTitle: string;
  briefDescription: string;
  companyIndustry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
  specificSkills?: string[];
  budgetRange?: string;
  projectType?: 'fixed' | 'hourly';
  remote?: boolean;
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
    const {
      jobTitle,
      briefDescription,
      companyIndustry = "Technology",
      experienceLevel = "mid",
      specificSkills = [],
      budgetRange,
      projectType = "fixed",
      remote = true
    }: JobGenerationRequest = await request.json();

    // Validation
    if (!jobTitle || !briefDescription) {
      return NextResponse.json(
        { message: "Job title and brief description are required" },
        { status: 400 }
      );
    }

    if (jobTitle.length < 3 || jobTitle.length > 100) {
      return NextResponse.json(
        { message: "Job title must be between 3 and 100 characters" },
        { status: 400 }
      );
    }

    if (briefDescription.length < 10 || briefDescription.length > 1000) {
      return NextResponse.json(
        { message: "Brief description must be between 10 and 1000 characters" },
        { status: 400 }
      );
    }

    // Construct comprehensive prompt
    const jobGenerationPrompt = `
You are an expert HR professional and job posting specialist. Create a comprehensive, professional job posting based on the following requirements:

**Job Title:** ${jobTitle}
**Brief Description:** ${briefDescription}
**Company Industry:** ${companyIndustry}
**Experience Level:** ${experienceLevel}
**Specific Skills Mentioned:** ${specificSkills.length > 0 ? specificSkills.join(", ") : "None specified"}
**Budget Range:** ${budgetRange || "Not specified"}
**Project Type:** ${projectType}
**Remote Position:** ${remote ? "Yes" : "No"}

**Your task is to generate a comprehensive job posting with the following structure:**

1. **Enhanced Job Title:** Improve the provided title to be more professional and descriptive (keep under 60 characters)

2. **Job Sections:** Create 4-6 detailed sections with professional content:
   - About the Role (150-200 words)
   - Key Responsibilities (4-6 bullet points)
   - Requirements & Qualifications (4-6 bullet points)
   - Preferred Skills (3-4 bullet points)
   - What We Offer (3-4 bullet points)
   - About the Company (optional, 100-150 words if relevant)

3. **Skills Extraction:** Identify 8-12 relevant technical skills from the description and industry context

4. **Project Details:** Determine appropriate:
   - Project type (fixed or hourly)
   - Engagement type (freelance, remote employee, or any)
   - Duration estimate
   - Budget range (if not provided)

**Guidelines:**
- Use professional, engaging language
- Make content specific to the ${experienceLevel} experience level
- Include modern, relevant technologies for ${companyIndustry}
- Ensure all sections are substantial and informative
- Use HTML formatting for rich text (paragraphs, lists, bold text)
- Focus on value proposition and growth opportunities
- Be inclusive and welcoming in tone

**Response Format:**
Return a JSON object with this exact structure:
{
  "title": "Enhanced job title",
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
          content: "You are an expert HR professional who creates exceptional job postings. Always respond with valid JSON only."
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

    // Set reasonable defaults for budget if not provided
    let estimatedBudget = generatedData.estimatedBudget;
    if (!estimatedBudget || !estimatedBudget.min || !estimatedBudget.max) {
      const budgetRanges = {
        entry: { min: 500, max: 2000 },
        mid: { min: 1500, max: 5000 },
        senior: { min: 3000, max: 10000 },
        lead: { min: 5000, max: 15000 }
      };
      estimatedBudget = {
        ...budgetRanges[experienceLevel],
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
    console.error("Error generating job with AI:", error);

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
        message: "Failed to generate job posting. Please try again or create manually."
      },
      { status: 500 }
    );
  }
}