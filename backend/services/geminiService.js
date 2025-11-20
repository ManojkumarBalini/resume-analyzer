// geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Create the client once (reads API key from env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of candidate models to try (best -> fallback)
const CANDIDATE_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash" // last resort; may not be available in some projects
];

// Main exported function (matches your original signature)
const analyzeResume = async (text) => {
  console.log("Starting Gemini analysis...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key not found in environment variables");
    throw new Error("Gemini API key not configured");
  }

  // Build prompt (same shape you already had)
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

  console.log("Calling Gemini API with prompt length:", prompt.length);

  // Try models in order until one works
  let lastError = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // generateContent accepts a string prompt in many SDK examples
      const result = await model.generateContent(prompt);

      // In this SDK `result.response` is usually a Promise-like or value containing .text()
      const response = await result.response;
      let jsonText = response.text();

      console.log(`Raw Gemini response received (model ${modelName}), length:`, jsonText.length || 0);

      // Cleanup: remove markdown fences and extract JSON block
      jsonText = jsonText.replace(/```json|```/g, "").trim();
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];

      console.log('Cleaned JSON text snippet:', jsonText.substring(0, 200) + '...');

      // Try parse
      const analysisResult = JSON.parse(jsonText);

      // If parsed OK, fill missing data and return
      console.log(`Model ${modelName} succeeded.`);
      return validateAndFill(analysisResult, text);

    } catch (err) {
      lastError = err;
      const msg = (err && err.toString && err.toString()) || String(err);
      console.warn(`Model ${modelName} failed:`, msg);

      // If it's a "model not found / not supported" (404) then try next model.
      // Detect common error strings from SDK/HTTP responses:
      if (/not found/i.test(msg) || /is not found for API version/i.test(msg) || /model.*not.*found/i.test(msg) || (err && err.statusCode === 404)) {
        console.log(`Model ${modelName} appears unavailable for this project — trying next candidate.`);
        continue; // try next model
      }

      // For other errors (quota, auth, etc.) break and fallback to local extraction:
      console.error(`Non-model-lookup error for ${modelName}. Will fallback to local extraction. Error:`, msg);
      break;
    }
  }

  console.error("All model attempts failed or an unrecoverable error occurred. Falling back to extraction.");
  console.error("Last Gemini error:", lastError && lastError.toString ? lastError.toString() : lastError);

  // If models failed, use your enhanced extraction fallback
  return getEnhancedAnalysisWithExtraction(text);
};

// -----------------------------
// Validate / Fill missing fields
// -----------------------------
function validateAndFill(analysisResult, text) {
  return {
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
    resume_rating: typeof analysisResult.resume_rating === "number" ? analysisResult.resume_rating : 7,
    improvement_areas: analysisResult.improvement_areas || "Consider adding more quantifiable achievements and specific project outcomes.",
    upskill_suggestions: analysisResult.upskill_suggestions || ["Learn cloud technologies", "Practice system design", "Explore DevOps practices"]
  };
}

// -----------------------------
// Your existing fallback extraction functions
// (paste your implementations here; I kept names identical)
// -----------------------------
function extractEmailFromText(text) {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return emailMatch ? emailMatch[0] : null;
}

function extractPhoneFromText(text) {
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : null;
}

function extractNameFromText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line && line.split(' ').length >= 2 && line.split(' ').length <= 4) {
      const words = line.split(' ');
      const allCapitalized = words.every(w => /^[A-Z][a-z]*$/.test(w));
      if (allCapitalized) return line;
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
  skillKeywords.forEach(skill => { if (lowerText.includes(skill.toLowerCase())) skills.push(skill); });
  return [...new Set(skills)];
}

function extractEducationFromText(text) {
  // your implementation (kept minimal here)
  const education = [];
  const lines = text.split('\n');
  const educationKeywords = ["university", "college", "institute", "bachelor", "master", "phd", "degree", "diploma"];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (educationKeywords.some(k => line.includes(k))) {
      const degree = lines[i].trim();
      const institution = lines[i-1] ? lines[i-1].trim() : "Institution";
      const year = extractYearFromText(lines[i]) || "2020";
      education.push({ degree, institution, graduation_year: year });
    }
  }
  return education.length > 0 ? education : getDefaultEducation();
}

function extractWorkExperienceFromText(text) {
  const experience = [];
  const lines = text.split('\n');
  const jobTitleKeywords = ["developer","engineer","manager","analyst","specialist","consultant"];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (jobTitleKeywords.some(k => line.includes(k))) {
      const role = lines[i].trim();
      const company = extractCompanyFromLine(lines[i]) || "Company";
      const duration = extractDurationFromText(text) || "2021 - Present";
      experience.push({
        role,
        company,
        duration,
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
  const words = line.split(' ').filter(w => /^[A-Z]/.test(w));
  return words.length > 0 ? words[0] : "Company";
}

function extractDurationFromText(text) {
  const durationMatch = text.match(/(20\d{2}\s*[-–]\s*(20\d{2}|Present|Current))/);
  return durationMatch ? durationMatch[0] : "2021 - Present";
}

function generateSummaryFromText(text, name) {
  const skills = extractSkillsFromText(text);
  const skillText = skills.length > 0 ? `Proficient in ${skills.slice(0,3).join(', ')}` : "technical";
  return `${name || "Experienced professional"} with strong ${skillText} skills. ${text.substring(0,100)}...`;
}

function calculateResumeRating(text) {
  let rating = 5;
  const skills = extractSkillsFromText(text);
  if (skills.length > 5) rating += 1;
  if (skills.length > 10) rating += 1;
  if (extractEmailFromText(text)) rating += 1;
  if (extractPhoneFromText(text)) rating += 1;
  if (extractEducationFromText(text).length > 0) rating += 1;
  return Math.min(rating, 10);
}

function generateImprovementAreas(text) {
  const areas = [];
  const skills = extractSkillsFromText(text);
  if (skills.length < 5) areas.push("Consider adding more technical skills to your resume");
  if (!extractEmailFromText(text) || !extractPhoneFromText(text)) areas.push("Ensure contact information is clearly visible");
  if (text.length < 500) areas.push("Provide more detailed descriptions of your experience and projects");
  return areas.length > 0 ? areas.join('. ') : "Consider adding more quantifiable achievements and specific project outcomes.";
}

function generateUpskillSuggestions(skills) {
  const suggestions = [];
  if (!skills.includes("AWS") && !skills.includes("Azure") && !skills.includes("Google Cloud")) suggestions.push("Learn cloud technologies (AWS, Azure, or Google Cloud)");
  if (!skills.includes("Docker") && !skills.includes("Kubernetes")) suggestions.push("Explore containerization and orchestration tools");
  if (skills.includes("JavaScript") && !skills.includes("TypeScript")) suggestions.push("Learn TypeScript for better code quality");
  suggestions.push("Practice system design concepts");
  suggestions.push("Learn about microservices architecture");
  return suggestions.slice(0,4);
}

function getDefaultWorkExperience() {
  return [{
    role: "Software Developer",
    company: "Technology Company",
    duration: "2021 - Present",
    description: ["Developed and maintained web applications", "Collaborated with teams", "Implemented features"]
  }];
}

function getDefaultEducation() {
  return [{ degree: "Bachelor of Science in Computer Science", institution: "University", graduation_year: "2020" }];
}

function getDefaultProjects() {
  return [{ name: "Web App", description: "Full stack app", technologies: ["React","Node.js","MongoDB"] }];
}

// Fallback wrapper (keeps your original fallback)
function getEnhancedAnalysisWithExtraction(text) {
  console.log('Performing enhanced analysis with text extraction');
  const email = extractEmailFromText(text);
  const phone = extractPhoneFromText(text);
  const name = extractNameFromText(text);
  const skills = extractSkillsFromText(text);
  const education = extractEducationFromText(text);
  const workExperience = extractWorkExperienceFromText(text);

  return {
    name,
    email,
    phone,
    linkedin_url: null,
    portfolio_url: null,
    summary: generateSummaryFromText(text, name),
    work_experience: workExperience.length > 0 ? workExperience : getDefaultWorkExperience(),
    education: education.length > 0 ? education : getDefaultEducation(),
    technical_skills: skills,
    soft_skills: ["Communication","Teamwork","Problem Solving","Adaptability","Leadership"],
    projects: getDefaultProjects(),
    certifications: [],
    resume_rating: calculateResumeRating(text),
    improvement_areas: generateImprovementAreas(text),
    upskill_suggestions: generateUpskillSuggestions(skills)
  };
}

module.exports = { analyzeResume };

