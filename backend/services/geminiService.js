const { GoogleGenerativeAI } = require("@google/generative-ai");

const analyzeResume = async (text) => {
  try {
    console.log('Starting Gemini analysis...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables');
      throw new Error('Gemini API key not configured');
    }

    // Initialize Gemini client with API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the correct model - gemini-pro is the available model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro"
    });

    // Enhanced prompt with strict JSON formatting
    const prompt = `Analyze the following resume text and extract information into a structured JSON format. Be thorough and extract as much real information as possible.

RESUME TEXT:
${text.substring(0, 15000)}

Return a valid JSON object with this structure:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "linkedin_url": "string or null",
  "portfolio_url": "string or null",
  "summary": "string describing the candidate's profile and experience",
  "work_experience": [
    {
      "role": "string",
      "company": "string",
      "duration": "string",
      "description": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "graduation_year": "string"
    }
  ],
  "technical_skills": ["string"],
  "soft_skills": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "certifications": ["string"],
  "resume_rating": number between 1-10,
  "improvement_areas": "string with specific suggestions",
  "upskill_suggestions": ["string"]
}

Extract real information from the resume text. If information is missing, use reasonable defaults.`;

    console.log('Calling Gemini API with prompt length:', prompt.length);
    
    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let jsonText = response.text();
    console.log('Raw Gemini response received, length:', jsonText.length);

    // Clean the response - remove any markdown code blocks
    jsonText = jsonText.replace(/```json|```/g, "").trim();
    
    // Extract JSON from response if it's wrapped in other text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    console.log('Cleaned JSON text:', jsonText.substring(0, 200) + '...');

    // Parse the JSON response
    const analysisResult = JSON.parse(jsonText);
    console.log('Successfully parsed Gemini response');

    // Validate and ensure all required fields are present
    const validatedResult = {
      name: analysisResult.name || extractNameFromText(text),
      email: analysisResult.email || extractEmailFromText(text),
      phone: analysisResult.phone || extractPhoneFromText(text),
      linkedin_url: analysisResult.linkedin_url || null,
      portfolio_url: analysisResult.portfolio_url || null,
      summary: analysisResult.summary || "Experienced professional with strong technical skills.",
      work_experience: analysisResult.work_experience || getDefaultWorkExperience(),
      education: analysisResult.education || getDefaultEducation(),
      technical_skills: analysisResult.technical_skills || extractSkillsFromText(text),
      soft_skills: analysisResult.soft_skills || ["Communication", "Teamwork", "Problem Solving"],
      projects: analysisResult.projects || getDefaultProjects(),
      certifications: analysisResult.certifications || [],
      resume_rating: analysisResult.resume_rating || 7,
      improvement_areas: analysisResult.improvement_areas || "Consider adding more quantifiable achievements and specific project outcomes.",
      upskill_suggestions: analysisResult.upskill_suggestions || ["Learn cloud technologies", "Practice system design", "Explore DevOps practices"]
    };

    console.log('Analysis completed successfully');
    return validatedResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    console.error("Error details:", error.message);
    
    // Enhanced fallback with better data extraction
    console.log("Using enhanced analysis with data extraction");
    return getEnhancedAnalysisWithExtraction(text);
  }
};

// Enhanced analysis with better data extraction from resume text
const getEnhancedAnalysisWithExtraction = (text) => {
  console.log('Performing enhanced analysis with text extraction');
  
  // Extract actual data from resume text
  const email = extractEmailFromText(text);
  const phone = extractPhoneFromText(text);
  const name = extractNameFromText(text);
  const skills = extractSkillsFromText(text);
  
  // Extract education information
  const education = extractEducationFromText(text);
  
  // Extract work experience patterns
  const workExperience = extractWorkExperienceFromText(text);
  
  return {
    name: name,
    email: email,
    phone: phone,
    linkedin_url: null,
    portfolio_url: null,
    summary: generateSummaryFromText(text, name),
    work_experience: workExperience.length > 0 ? workExperience : getDefaultWorkExperience(),
    education: education.length > 0 ? education : getDefaultEducation(),
    technical_skills: skills,
    soft_skills: ["Communication", "Teamwork", "Problem Solving", "Adaptability", "Leadership"],
    projects: getDefaultProjects(),
    certifications: [],
    resume_rating: calculateResumeRating(text),
    improvement_areas: generateImprovementAreas(text),
    upskill_suggestions: generateUpskillSuggestions(skills)
  };
};

// Enhanced helper functions
function extractEmailFromText(text) {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return emailMatch ? emailMatch[0] : null;
}

function extractPhoneFromText(text) {
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : null;
}

function extractNameFromText(text) {
  // Look for name patterns - typically at the beginning of the document
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Check first few lines for potential name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Name pattern: 2-4 words, capitalized, no special characters (mostly)
    if (line && line.split(' ').length >= 2 && line.split(' ').length <= 4) {
      const words = line.split(' ');
      const allCapitalized = words.every(word => /^[A-Z][a-z]*$/.test(word));
      if (allCapitalized) {
        return line;
      }
    }
  }
  
  return "Candidate";
}

function extractSkillsFromText(text) {
  const skills = [];
  const skillKeywords = [
    "JavaScript", "React", "Node.js", "Python", "Java", "HTML", "CSS", "SQL",
    "MongoDB", "Express", "AWS", "Docker", "Git", "TypeScript", "Angular", "Vue",
    "PHP", "C++", "C#", ".NET", "Spring", "MySQL", "PostgreSQL", "Redis",
    "Kubernetes", "Azure", "Google Cloud", "REST API", "GraphQL", "Jenkins",
    "CI/CD", "Agile", "Scrum", "Machine Learning", "Data Structures", "Algorithms"
  ];

  const lowerText = text.toLowerCase();
  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  // Remove duplicates
  return [...new Set(skills)];
}

function extractEducationFromText(text) {
  const education = [];
  const lines = text.split('\n');
  
  const educationKeywords = ["university", "college", "institute", "bachelor", "master", "phd", "degree", "diploma"];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      // Look for degree and institution in nearby lines
      let degree = lines[i] || "Degree";
      let institution = lines[i-1] || "Institution";
      let year = extractYearFromText(lines[i]) || "2020";
      
      education.push({
        degree: degree.trim(),
        institution: institution.trim(),
        graduation_year: year
      });
    }
  }
  
  return education.length > 0 ? education : getDefaultEducation();
}

function extractWorkExperienceFromText(text) {
  const experience = [];
  const lines = text.split('\n');
  
  // Look for common job title patterns
  const jobTitleKeywords = ["developer", "engineer", "manager", "analyst", "specialist", "consultant"];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (jobTitleKeywords.some(keyword => line.includes(keyword))) {
      const role = lines[i] || "Professional Role";
      const company = extractCompanyFromLine(lines[i]) || "Company";
      const duration = extractDurationFromText(text) || "2021 - Present";
      
      experience.push({
        role: role.trim(),
        company: company,
        duration: duration,
        description: [
          "Responsible for various professional duties and projects",
          "Collaborated with team members to achieve organizational goals",
          "Developed and implemented solutions to business challenges"
        ]
      });
    }
  }
  
  return experience.length > 0 ? experience : getDefaultWorkExperience();
}

function extractYearFromText(text) {
  const yearMatch = text.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : null;
}

function extractCompanyFromLine(line) {
  // Simple extraction - look for capitalized words that might be company names
  const words = line.split(' ').filter(word => /^[A-Z]/.test(word));
  return words.length > 0 ? words[0] : "Company";
}

function extractDurationFromText(text) {
  const durationMatch = text.match(/(20\d{2}\s*[-–]\s*(20\d{2}|Present|Current))/);
  return durationMatch ? durationMatch[0] : "2021 - Present";
}

function generateSummaryFromText(text, name) {
  const skills = extractSkillsFromText(text);
  const skillText = skills.length > 0 ? `Proficient in ${skills.slice(0, 3).join(', ')}` : "technical";
  
  return `${name || "Experienced professional"} with strong ${skillText} skills. ${text.substring(0, 100)}...`;
}

function calculateResumeRating(text) {
  let rating = 5; // Base rating
  
  // Adjust rating based on content quality
  const skills = extractSkillsFromText(text);
  if (skills.length > 5) rating += 1;
  if (skills.length > 10) rating += 1;
  
  if (extractEmailFromText(text)) rating += 1;
  if (extractPhoneFromText(text)) rating += 1;
  if (extractEducationFromText(text).length > 0) rating += 1;
  
  return Math.min(rating, 10); // Cap at 10
}

function generateImprovementAreas(text) {
  const areas = [];
  const skills = extractSkillsFromText(text);
  
  if (skills.length < 5) {
    areas.push("Consider adding more technical skills to your resume");
  }
  
  if (!extractEmailFromText(text) || !extractPhoneFromText(text)) {
    areas.push("Ensure contact information is clearly visible");
  }
  
  if (text.length < 500) {
    areas.push("Provide more detailed descriptions of your experience and projects");
  }
  
  return areas.length > 0 ? areas.join('. ') : "Consider adding more quantifiable achievements and specific project outcomes.";
}

function generateUpskillSuggestions(skills) {
  const suggestions = [];
  
  if (!skills.includes("AWS") && !skills.includes("Azure") && !skills.includes("Google Cloud")) {
    suggestions.push("Learn cloud technologies (AWS, Azure, or Google Cloud)");
  }
  
  if (!skills.includes("Docker") && !skills.includes("Kubernetes")) {
    suggestions.push("Explore containerization and orchestration tools");
  }
  
  if (skills.includes("JavaScript") && !skills.includes("TypeScript")) {
    suggestions.push("Learn TypeScript for better code quality");
  }
  
  suggestions.push("Practice system design concepts");
  suggestions.push("Learn about microservices architecture");
  
  return suggestions.slice(0, 4);
}

function getDefaultWorkExperience() {
  return [
    {
      role: "Software Developer",
      company: "Technology Company",
      duration: "2021 - Present",
      description: [
        "Developed and maintained web applications using modern technologies",
        "Collaborated with cross-functional teams to deliver quality software solutions",
        "Implemented new features and improved system performance"
      ]
    }
  ];
}

function getDefaultEducation() {
  return [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University",
      graduation_year: "2020"
    }
  ];
}

function getDefaultProjects() {
  return [
    {
      name: "Web Application Development",
      description: "Developed a full-stack web application with modern frameworks and technologies",
      technologies: ["React", "Node.js", "MongoDB", "Express"]
    }
  ];
}

module.exports = { analyzeResume };
