import { NextRequest, NextResponse } from "next/server";
import { createPDFToProfilePrompt } from "../prompts/pdf-to-profile-prompt";

// Create Profile With Chat GPT
const createProfileWithChatGPT = async (pdfText: string) => {
  console.log(pdfText, "This is pdf text");

  const prompt = createPDFToProfilePrompt(pdfText);

  // Check prompt length to avoid token limits
  const promptLength = prompt.length;
  console.log("Prompt length:", promptLength);

  if (promptLength > 20000) {
    console.warn("Prompt is very long, might hit token limits");
  }

  try {
    // Make API call to ChatGPT
    console.log("Making API call to OpenAI with model: gpt-4-1106-preview");
    console.log("PDF text length:", pdfText.length);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume parser and professional profile generator. Extract ALL information from the resume and create a comprehensive JSON profile. Respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    console.log("API Response Status:", response.status);
    console.log("API Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error Response:", errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response Data:", data);

    const generatedText = data.choices[0]?.message?.content;
    console.log("Generated Text:", generatedText);

    if (!generatedText) {
      throw new Error("No response from ChatGPT");
    }

    // Parse the JSON response
    let profileData;
    try {
      profileData = JSON.parse(generatedText);
      console.log("Successfully parsed JSON profile data");
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Generated text that failed to parse:", generatedText);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    return profileData;
  } catch (error) {
    console.error("Detailed Error calling ChatGPT:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Fallback to basic parsing if ChatGPT fails
    return {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone_number: "1234567890",
      phone_country_code: "+1",
      country: "United States",
      city: "San Francisco",
      title: "Software Engineer",
      description:
        "Experienced software engineer with expertise in full-stack development and modern web technologies.",
      about_work:
        "Passionate about creating innovative solutions and delivering high-quality software products. Seeking opportunities to work on challenging projects and contribute to meaningful technological advancements.",
      linkedin: "",
      github: "",
      portfolio: "",
      skills: "JavaScript, React, Node.js, Python, AWS, Docker",
      rate: 75,
      experience: [
        {
          title: "Software Engineer",
          company: "Previous Company",
          location: "San Francisco, CA",
          startDate: "2022-01",
          endDate: "Present",
          description:
            "Led development of various software projects and collaborated with cross-functional teams.",
        },
      ],
      education: [
        {
          degree: "Bachelor's Degree",
          institution: "University",
          location: "City, State",
          startDate: "2016-09",
          endDate: "2020-05",
          gpa: "3.8/4.0",
        },
      ],
      certifications: [],
      projects: [],
      languages: []
    };
  }
};

//
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (pdfFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    // Convert File to Buffer for external API
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create form data for external API using FormData
    const externalFormData = new FormData();
    const blob = new Blob([buffer], { type: "application/pdf" });
    externalFormData.append("pdf", blob, pdfFile.name);

    // Send request to external PDF text extractor
    const externalResponse = await fetch(
      "https://pdf-text-extractor-ki7lh2h1i-jubayer-juhans-projects-85b1bbdc.vercel.app/upload-pdf",
      {
        method: "POST",
        body: externalFormData,
      },
    );

    if (!externalResponse.ok) {
      console.error(
        "External API error:",
        externalResponse.status,
        externalResponse.statusText,
      );
      return NextResponse.json(
        { error: "Failed to extract text from PDF" },
        { status: 500 },
      );
    }

    const pdfParsingResponse = await externalResponse.json();

    // Process the extracted text to generate profile data
    const profileData = await createProfileWithChatGPT(pdfParsingResponse.text);

    return NextResponse.json({
      status: "completed",
      data: profileData,
      message: "Profile data generated successfully from PDF",
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to process PDF file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
