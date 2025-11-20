// geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize client once (reads API key from env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Candidate models (best -> fallback)
const CANDIDATE_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];

// Main exported function
async function analyzeResume(text) {
  console.log("=== Starting Gemini analysis ===");
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key not found in environment variables");
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Build a careful prompt asking for JSON only and preserving URLs
  const prompt = `
Extract structured resume information from the text below and return ONLY a valid JSON object (no explanation, no markdown, no extra text).
Be thorough and include complete URLs (with https://) for LinkedIn, GitHub, portfolio or any profile links.
If any field is missing, return null for that field.

RESUME TEXT:
${text.substring(0, 15000)}

Return JSON with this exact structure:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "linkedin_url": "string or null",
  "portfolio_url": "string or null",
  "summary": "string or null",
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
  "resume_rating": number,
  "improvement_areas": "string",
  "upskill_suggestions": ["string"]
}
`;

  console.log("Prompt length:", prompt.length);

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);

      // getResponseText handles multiple SDK response shapes
      const rawText = await getResponseText(result);
      if (!rawText || rawText.trim().length === 0) {
        throw new Error(`Empty response from model ${modelName}`);
      }

      console.log(`Raw response length (model ${modelName}):`, rawText.length);

      // Clean up fences and try to extract JSON block
      let jsonText = rawText.replace(/```json|```/g, "").trim();

      // Try to extract first {...} JSON object
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) jsonText = match[0];

      // Try parse
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseErr) {
        // If parsing fails, try to salvage by fixing trailing commas, etc.
        const fixed = tryFixJson(jsonText);
        parsed = JSON.parse(fixed);
      }

      console.log(`Model ${modelName} succeeded and returned valid JSON.`);
      return fillMissingData(parsed, text);
    } catch (err) {
      lastError = err;
      const msg = err && err.toString ? err.toString() : String(err);
      console.warn(`Model ${modelName} failed:`, msg);

      // If model not found / unsupported -> try next model
      if (/not found/i.test(msg) || /is not found for api version/i.test(msg) || /is not supported/i.test(msg) || (err && err.statusCode === 404)) {
        console.log(`Model ${modelName} unavailable for this project — trying next candidate.`);
        continue;
      }

      // For other errors (quota, auth, unexpected), log and break to fallback
      console.error(`Unrecoverable error on model ${modelName}:`, msg);
      break;
    }
  }

  console.error("All model attempts failed or an unrecoverable error occurred. Falling back to local extraction.");
  if (lastError) console.error("Last error:", lastError.toString ? lastError.toString() : lastError);

  return getEnhancedAnalysisWithExtraction(text);
}

// Helper: robustly get text from SDK result
async function getResponseText(result) {
  // Common SDK shape: result.response which may be a value with .text() or an object
  try {
    if (!result) return null;

    if (result.response) {
      const resp = await result.response;
      if (resp == null) return null;
      if (typeof resp.text === "function") {
        return await resp.text();
      }
      // some shapes may expose output[0].content[0].text
      if (resp.output && Array.isArray(resp.output) && resp.output.length > 0) {
        const first = resp.output[0];
        if (first.content && Array.isArray(first.content) && first.content.length > 0) {
          // find the first item with text
          for (const c of first.content) {
            if (c.type === "output_text" && typeof c.text === "string") return c.text;
            if (typeof c.text === "string") return c.text;
          }
        }
      }
      // fallback to stringifying resp
      return typeof resp === "string" ? resp : JSON.stringify(resp);
    }

    // Some SDKs return result.output (older shapes)
    if (result.output && Array.isArray(result.output) && result.output.length > 0) {
      const out = result.output[0];
      if (out.content && Array.isArray(out.content) && out.content.length > 0) {
        for (const c of out.content) {
          if (typeof c.text === "string") return c.text;
        }
      }
      if (typeof out.text === "string") return out.text;
    }

    // As last resort, stringify
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (e) {
    console.warn("getResponseText failed:", e && e.toString ? e.toString() : e);
    return null;
  }
}

// Try to fix common JSON problems (trailing commas, unquoted keys)
function tryFixJson(s) {
  let fixed = s;

  // Remove trailing commas in objects/arrays
  fixed = fixed.replace(/,\s*([}\]])/g, "$1");

  // If keys are unquoted, attempt naive quoting (dangerous but helpful sometimes)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  return fixed;
}

// Fill missing fields using robust extraction fallbacks
function fillMissingData(data, text) {
  return {
    name: data.name || extractNameFromText(text),
    email: data.email || extractEmailFromText(text),
    phone: data.phone || extractPhoneFromText(text),
    linkedin_url: data.linkedin_url || extractLinkedIn(text),
    portfolio_url: data.portfolio_url || extractPortfolio(text),
    summary: data.summary || generateSummaryFromText(text, data.name),
    work_experience: Array.isArray(data.work_experience) ? data.work_experience : getDefaultWorkExperience(),
    education: Array.isArray(data.education) ? data.education : getDefaultEducation(),
    technical_skills: Array.isArray(data.technical_skills) && data.technical_skills.length > 0 ? data.technical_skills : extractSkillsFromText(text),
    soft_skills: Array.isArray(data.soft_skills) && data.soft_skills.length > 0 ? data.soft_skills : ["Communication", "Teamwork", "Problem Solving"],
    projects: Array.isArray(data.projects) ? data.projects : getDefaultProjects(),
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    resume_rating: typeof data.resume_rating === "number" ? data.resume_rating : calculateResumeRating(text),
    improvement_areas: data.improvement_areas || generateImprovementAreas(text),
    upskill_suggestions: Array.isArray(data.upskill_suggestions) && data.upskill_suggestions.length > 0 ? data.upskill_suggestions : generateUpskillSuggestions(extractSkillsFromText(text))
  };
}

/* -----------------------
   Fallback / extraction functions
   ----------------------- */

function extractEmailFromText(text) {
  const m = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : null;
}

function extractPhoneFromText(text) {
  // Various phone formats including +91 and 10-digit numbers
  const m = text.match(/(\+?\d{1,3}[-.\s]?)?(\d{10}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/);
  return m ? m[0].trim() : null;
}

function extractURLSFromText(text) {
  // capture https? urls
  const urls = [];
  const regex = /https?:\/\/[^\s)>\]]+/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    urls.push(match[0].replace(/[.,;)]$/g, ""));
  }
  return urls;
}

// UPDATED: Better LinkedIn extraction
function extractLinkedIn(text) {
  // Try to find explicit linkedin url
  const urls = extractURLSFromText(text);
  const linkedinUrl = urls.find(u => /linkedin\.com/i.test(u));
  if (linkedinUrl) return linkedinUrl;
  
  // Look for LinkedIn patterns in text
  const linkedinPatterns = [
    /linkedin\.com\/in\/([A-Za-z0-9-_.%]+)/i,
    /linkedin\.com\/([A-Za-z0-9-_.%]+)/i,
    /linkedin:\s*([A-Za-z0-9-_.%]+)/i,
    /linkedin\s*\/\s*([A-Za-z0-9-_.%]+)/i,
    /in\/\s*([A-Za-z0-9-_.%]+)/i
  ];
  
  for (const pattern of linkedinPatterns) {
    const match = text.match(pattern);
    if (match) {
      const username = match[1] || match[0];
      return `https://www.linkedin.com/in/${username}`;
    }
  }
  
  return null;
}

// UPDATED: Better Portfolio extraction
function extractPortfolio(text) {
  // Look for portfolio URLs
  const urls = extractURLSFromText(text);
  const portfolioUrls = urls.filter(u => 
    /(github\.com|gitlab\.com|behance\.net|dribbble\.com|vercel\.app|netlify\.app|portfolio|github\.io|gitlab\.io)/i.test(u)
  );
  
  if (portfolioUrls.length > 0) {
    return portfolioUrls[0];
  }
  
  // Look for GitHub patterns
  const githubPatterns = [
    /github\.com\/([A-Za-z0-9-_.%]+)/i,
    /github:\s*([A-Za-z0-9-_.%]+)/i,
    /github\s*\/\s*([A-Za-z0-9-_.%]+)/i
  ];
  
  for (const pattern of githubPatterns) {
    const match = text.match(pattern);
    if (match) {
      const username = match[1] || match[0];
      return `https://github.com/${username}`;
    }
  }
  
  return null;
}

function extractNameFromText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  // Common: first non-empty line is name if short
  if (lines.length > 0) {
    const first = lines[0];
    if (first.length > 2 && first.length < 60 && /^[A-Z][A-Za-z.'\-\s]+$/.test(first)) {
      // simple heuristic
      return first;
    }
  }
  // fallback: search for "Name:" pattern
  const m = text.match(/(?:Name|Full Name)[:\s]*([A-Z][A-Za-z.'\-\s]{2,40})/i);
  if (m) return m[1].trim();
  return "Candidate";
}

function extractSkillsFromText(text) {
  const skillKeywords = [
    "JavaScript", "React", "Node", "Node.js", "Python", "Java", "C++", "C#", "TypeScript",
    "HTML", "CSS", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes",
    "AWS", "Azure", "Google Cloud", "GCP", "Spring", "Flask", "Django", "Express",
    "REST API", "GraphQL", "Git", "CI/CD", "Jenkins", "Maven", "JUnit", "Machine Learning",
    "Data Structures", "Algorithms", "React Native", "Next.js"
  ];
  const lower = text.toLowerCase();
  const found = skillKeywords.filter(s => lower.includes(s.toLowerCase()));
  return [...new Set(found)];
}

function extractEducationFromText(text) {
  const education = [];
  const lines = text.split("\n");
  const keywords = ["university", "college", "institute", "bachelor", "b.tech", "bsc", "master", "m.tech", "phd", "degree", "diploma"];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (keywords.some(k => l.includes(k))) {
      const degree = lines[i].trim();
      const institution = i > 0 ? lines[i - 1].trim() : "Institution";
      const year = extractYearFromText(lines[i]) || extractYearFromText(lines.slice(i, i + 3).join(" ")) || null;
      education.push({
        degree,
        institution,
        graduation_year: year || null
      });
    }
  }
  return education;
}

function extractWorkExperienceFromText(text) {
  const experience = [];
  const lines = text.split("\n");
  const jobKeywords = ["developer", "engineer", "intern", "manager", "consultant", "analyst", "lead", "student"];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (jobKeywords.some(k => l.includes(k))) {
      const roleLine = lines[i].trim();
      // try to capture company from same line or nearby lines
      let company = "Company";
      const cMatch = roleLine.match(/at\s+([A-Z][A-Za-z0-9 &.-]{2,50})/);
      if (cMatch) company = cMatch[1].trim();
      const duration = extractDurationFromText(roleLine) || extractDurationFromText(lines.slice(i, i + 5).join(" ")) || null;
      experience.push({
        role: roleLine,
        company,
        duration: duration || "Present",
        description: ["No description provided"]
      });
    }
  }
  return experience;
}

function extractYearFromText(text) {
  const m = text.match(/(19|20)\d{2}/);
  return m ? m[0] : null;
}

function extractCompanyFromLine(line) {
  const words = line.split(" ").filter(w => /^[A-Z]/.test(w));
  return words.length > 0 ? words[0] : null;
}

function extractDurationFromText(text) {
  const m = text.match(/(20\d{2}\s*[-–]\s*(20\d{2}|Present|Current)|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec\s+\d{4}\s*[-–]\s*(Present|Current|\d{4}))/i);
  return m ? m[0] : null;
}

function generateSummaryFromText(text, name) {
  const skills = extractSkillsFromText(text);
  const skillText = skills.length > 0 ? `Proficient in ${skills.slice(0, 3).join(", ")}` : "skilled in software development";
  return `${name || "Candidate"} - ${skillText}. ${text.substring(0, 120)}...`;
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
  if (skills.length < 5) areas.push("Add more technical skills and relevant keywords.");
  if (!extractEmailFromText(text) || !extractPhoneFromText(text)) areas.push("Add clear contact information.");
  if (!extractLinkedIn(text)) areas.push("Add LinkedIn profile link.");
  if (text.length < 500) areas.push("Provide more detail in work experience and project descriptions.");
  return areas.join(" ");
}

function generateUpskillSuggestions(skills) {
  const suggestions = [];
  if (!skills.includes("AWS") && !skills.includes("Azure") && !skills.includes("Google Cloud")) suggestions.push("Learn cloud fundamentals (AWS/Azure/GCP).");
  if (!skills.includes("Docker") && !skills.includes("Kubernetes")) suggestions.push("Explore containerization and orchestration (Docker, Kubernetes).");
  if (skills.includes("JavaScript") && !skills.includes("TypeScript")) suggestions.push("Learn TypeScript for stronger front-end code.");
  suggestions.push("Practice system design and architecture.");
  return suggestions.slice(0, 5);
}

function getDefaultWorkExperience() {
  return [{
    role: "Software Developer",
    company: "Technology Company",
    duration: "2021 - Present",
    description: ["Developed and maintained web applications", "Collaborated with cross-functional teams"]
  }];
}

function getDefaultEducation() {
  return [{
    degree: "Bachelor's Degree",
    institution: "University",
    graduation_year: "2020"
  }];
}

function getDefaultProjects() {
  return [{
    name: "Web Application",
    description: "Built a full-stack web application",
    technologies: ["React", "Node.js", "MongoDB"]
  }];
}

// Fallback wrapper (keeps your original behavior)
function getEnhancedAnalysisWithExtraction(text) {
  console.log("Performing enhanced extraction fallback.");
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
    linkedin_url: extractLinkedIn(text),
    portfolio_url: extractPortfolio(text),
    summary: generateSummaryFromText(text, name),
    work_experience: workExperience.length ? workExperience : getDefaultWorkExperience(),
    education: education.length ? education : getDefaultEducation(),
    technical_skills: skills,
    soft_skills: ["Communication", "Teamwork", "Problem Solving"],
    projects: getDefaultProjects(),
    certifications: [],
    resume_rating: calculateResumeRating(text),
    improvement_areas: generateImprovementAreas(text),
    upskill_suggestions: generateUpskillSuggestions(skills)
  };
}

module.exports = { analyzeResume };


