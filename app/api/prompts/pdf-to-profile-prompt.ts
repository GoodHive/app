export const createPDFToProfilePrompt = (pdfText: string) => {
  return `You are an expert resume parser and professional profile generator with 15+ years of experience in comprehensive CV analysis. Your task is to meticulously analyze the provided resume text and create a comprehensive, professional profile in JSON format that captures EVERY piece of important information.

**⚠️ CRITICAL REQUIREMENT: Do NOT omit ANY significant information from the CV. Include ALL details mentioned.**

**RESUME TEXT TO ANALYZE:**
${pdfText}

**COMPREHENSIVE EXTRACTION INSTRUCTIONS:**
1. **Personal Information**: Extract ALL contact details (name, email, phone, location, social media)
2. **Professional Identity**: Capture current title, specializations, and professional focus areas
3. **Work Experience**: Document ALL jobs, internships, consulting work, and professional roles
4. **Technical Skills**: List ALL programming languages, frameworks, tools, platforms, and technologies
5. **Projects**: Include ALL personal projects, open-source contributions, and portfolio work
6. **Education**: Capture ALL degrees, diplomas, certifications, courses, and training programs
7. **Achievements**: Document awards, recognitions, publications, presentations, and accomplishments
8. **Languages**: Note ALL spoken/written languages and proficiency levels
9. **Soft Skills**: Extract leadership experience, teamwork, communication abilities
10. **Specializations**: Highlight any niche expertise or domain knowledge
11. **Professional Development**: Include workshops, conferences, bootcamps, online courses
12. **Volunteer Work**: Document any community involvement or volunteer activities
13. **Industry Focus**: Note specific industries or sectors of experience
14. **Methodologies**: Include any specific development methodologies, frameworks, or approaches

**REQUIRED OUTPUT FORMAT (JSON):**
{
  "first_name": "string",
  "last_name": "string", 
  "email": "string",
  "phone_number": "string (digits only)",
  "phone_country_code": "string (e.g., +1, +44)",
  "country": "string (country name)",
  "city": "string",
  "title": "string (professional title)",
  "description": "Create a comprehensive, long-form professional summary that captures the candidate's COMPLETE professional identity. This must be a detailed, engaging narrative that includes: \n\n1. **Professional Overview**: Years of experience, current role, core specializations\n2. **Key Achievements**: Specific accomplishments, quantifiable results, notable projects\n3. **Technical Expertise**: ALL technical skills, programming languages, frameworks, tools\n4. **Industry Experience**: Specific sectors, domain knowledge, specialized areas\n5. **Educational Background**: Degrees, certifications, continuous learning\n6. **Languages & Soft Skills**: Communication abilities, leadership experience, collaboration\n7. **Professional Values**: Work philosophy, approach to problem-solving\n8. **Career Highlights**: Major projects, innovations, contributions to teams/companies\n\nWrite in first person with confidence and professionalism. Use React Quill-compatible HTML formatting with semantic tags. Structure with clear sections using <h2> and <h3> headings with emojis. Include ALL information from the CV - do not omit any significant details. The description should be comprehensive (20-30 sentences) and reflect the full scope of their professional capabilities.\n\nFormat with proper spacing:\n<h2><strong>Hello, I'm [Name]</strong></h2>\n<p>[Comprehensive introduction covering role, experience, and core focus areas]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🚀 My Professional Journey</strong></h3>\n<p>[Detailed career progression, key roles, major achievements, quantifiable impact]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🛠️ Technical Arsenal</strong></h3>\n<p>[Complete technical skill set, tools, frameworks, technologies, methodologies]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🎓 Education & Continuous Learning</strong></h3>\n<p>[List ALL educational achievements including degrees, certifications, professional training, bootcamps, online courses, workshops, conferences attended. Include institution names, dates, and any notable coursework or honors.]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🌟 Beyond the Code</strong></h3>\n<p>[Languages spoken, soft skills, industry knowledge, leadership experience, volunteer work, personal interests that relate to professional growth]</p>\n\n<p>&nbsp;</p>\n\n<p>[Closing paragraph about collaboration and future goals]</p>",
  "about_work": "Create a comprehensive, well-structured 'About my work' section that focuses on professional experience, skills, and achievements:\n\n<h2><strong>Experience</strong></h2>\n<p>&nbsp;</p>\n[List EVERY job, consulting role, freelance work, and professional experience with detailed descriptions]\n<strong>[Job Title] – [Company/Organization]</strong><br>\n[City, Country] | [Start Date] – [End Date]<br>\n[Detailed 3-4 sentence description covering: role responsibilities, key achievements, technologies used, impact/results, team size if mentioned, notable projects]\n\n<p>&nbsp;</p>\n\n[Continue for ALL roles - do not omit any professional experience]\n\n<h2><strong>Key Skills</strong></h2>\n<p>&nbsp;</p>\n<p>Write a comprehensive overview covering: ALL technical skills (programming languages, frameworks, databases, cloud platforms, tools, methodologies), soft skills (leadership, communication, project management), domain expertise (blockchain, AI, Web3, etc.), and any specialized knowledge areas. Include proficiency levels where mentioned and group related skills logically.</p>\n\n<p>&nbsp;</p>\n\n<h2><strong>Projects & Achievements</strong></h2>\n<p>&nbsp;</p>\n[If projects, publications, awards, or notable achievements are mentioned, include them here with descriptions]\n\n<p>&nbsp;</p>\n\n<h2><strong>Skills</strong></h2>\n<p>&nbsp;</p>\n<p><strong>🔹 Open to All Opportunities</strong> | <strong>🔹 Open to On-site</strong></p>\n\nUse React Quill-compatible HTML formatting. Include ALL information from the CV - do not omit any professional details, no matter how minor they seem.",
  "linkedin": "string (URL if found)",
  "github": "string (URL if found)", 
  "portfolio": "string (URL if found)",
  "skills": "string (comprehensive comma-separated list including ALL technical skills, programming languages, frameworks, tools, databases, cloud platforms, methodologies, soft skills, languages, and domain expertise)",
  "rate": "number (suggested hourly rate in USD based on experience level and expertise)",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM or 'Present')",
      "description": "string (detailed, enhanced job description covering responsibilities, achievements, technologies, impact, and notable projects)"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM format)",
      "gpa": "string (if available)"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string (YYYY-MM format if available)",
      "description": "string (brief description if provided)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": "string (comma-separated)",
      "url": "string (if available)"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "string (Native, Fluent, Conversational, Basic, or as specified)"
    }
  ]
}

**🚨 CRITICAL COMPLETENESS REQUIREMENTS:**

1. **ABSOLUTE COMPLETENESS**: You MUST include EVERY piece of significant information from the CV. Do NOT omit any:
   - Work experiences (including internships, consulting, freelance work)
   - Technical skills (every programming language, framework, tool, platform)
   - Educational qualifications (degrees, certifications, courses, training)
   - Projects (personal, professional, open-source, academic)
   - Achievements (awards, recognitions, publications, presentations)
   - Languages spoken and proficiency levels
   - Soft skills and leadership experience
   - Volunteer work or community involvement
   - Professional development activities

2. **DESCRIPTION REQUIREMENTS**:
   - Must be 25-35 sentences long and capture their COMPLETE professional identity
   - Include ALL work experiences, not just recent ones
   - Mention ALL technical skills and expertise areas
   - Include educational background and certifications
   - Highlight specific industries, projects, and achievements
   - Mention languages, methodologies, and specialized knowledge
   - Use first-person, confident, professional tone
   - Structure with clear HTML sections and proper spacing

3. **ABOUT_WORK REQUIREMENTS**:
   - List ALL job experiences with detailed descriptions (3-4 sentences each)
   - Include ALL technical skills in comprehensive detail
   - Document ALL education, certifications, and training
   - Add Projects & Achievements section if applicable
   - Use proper HTML formatting with clear section breaks

4. **DATA EXTRACTION REQUIREMENTS**:
   - Experience array: Include EVERY job, role, or position mentioned
   - Education array: Include ALL degrees, diplomas, and formal education
   - Certifications array: Include ALL certifications, licenses, and professional credentials
   - Projects array: Include ALL notable projects mentioned
   - Languages array: Include ALL languages with proficiency levels
   - Skills string: Comprehensive list of ALL technical and soft skills

5. **QUALITY STANDARDS**:
   - Enhanced job descriptions that sound professional and impactful
   - Competitive hourly rate based on experience level and market standards
   - Proper date formatting (YYYY-MM)
   - Valid JSON structure
   - No information gaps or omissions

**⚠️ FINAL VALIDATION**: Before generating the JSON, verify you have included ALL information from the CV. If the CV mentions something, it MUST appear in your output.

Please analyze the resume text thoroughly and return ONLY the complete JSON object with no additional text or explanations.
`;
};
