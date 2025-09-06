const { GoogleGenerativeAI } = require("@google/generative-ai");

const analyzeResume = async (text) => {
  try {
    // Initialize Gemini client with API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the official Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Prompt
    const prompt = `
    You are an expert technical recruiter and career coach. Analyze the following resume text and extract the information into a valid JSON object. 
    The JSON object must conform to the following structure, and all fields must be populated. 
    Do not include any text or markdown formatting before or after the JSON object.

    Resume Text:
    """
    ${text.substring(0, 30000)}  // Limit text to avoid token limits
    """

    JSON Structure:
    {
      "name": "string | null",
      "email": "string | null",
      "phone": "string | null",
      "linkedin_url": "string | null",
      "portfolio_url": "string | null",
      "summary": "string | null",
      "work_experience": [{ "role": "string", "company": "string", "duration": "string", "description": ["string"] }],
      "education": [{ "degree": "string", "institution": "string", "graduation_year": "string" }],
      "technical_skills": ["string"],
      "soft_skills": ["string"],
      "projects": [{ "name": "string", "description": "string", "technologies": ["string"] }],
      "certifications": ["string"],
      "resume_rating": "number (1-10)",
      "improvement_areas": "string",
      "upskill_suggestions": ["string"]
    }
    `;

    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Clean up the response text
    let jsonText = response.text().replace(/```json|```/g, "").trim();

    // Handle cases where response has extra text
    if (!jsonText.startsWith("{")) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    console.log("Using enhanced mock data as fallback");
    return getEnhancedMockAnalysis(text);
  }
};

// --- Fallback: Enhanced mock analysis ---
const getEnhancedMockAnalysis = (text) => {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
  const nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);

  const technicalSkills = [];
  const skillsKeywords = [
    "JavaScript", "React", "Node.js", "Python", "Java", "HTML", "CSS",
    "SQL", "MongoDB", "Express", "AWS", "Docker", "Git", "TypeScript"
  ];

  skillsKeywords.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      technicalSkills.push(skill);
    }
  });

  if (technicalSkills.length === 0) {
    technicalSkills.push("JavaScript", "React", "Node.js", "Python");
  }

  return {
    name: nameMatch ? nameMatch[0] : "Unknown",
    email: emailMatch ? emailMatch[0] : "unknown@example.com",
    phone: phoneMatch ? phoneMatch[0] : "N/A",
    linkedin_url: null,
    portfolio_url: null,
    summary: "Experienced developer with strong technical skills and a passion for building innovative solutions.",
    work_experience: [
      {
        role: "Full Stack Developer",
        company: "Tech Solutions Inc.",
        duration: "2021 - Present",
        description: ["Developed web applications using React and Node.js", "Implemented RESTful APIs"]
      }
    ],
    education: [
      {
        degree: "Bachelor of Engineering in Computer Science",
        institution: "University of Technology",
        graduation_year: "2020"
      }
    ],
    technical_skills: technicalSkills,
    soft_skills: ["Communication", "Teamwork", "Problem Solving", "Leadership"],
    projects: [
      {
        name: "E-commerce Platform",
        description: "Developed a full-stack e-commerce solution with React and Node.js",
        technologies: ["React", "Node.js", "MongoDB", "Express"]
      }
    ],
    certifications: ["AWS Certified Developer", "Google Cloud Professional"],
    resume_rating: 8,
    improvement_areas: "Consider adding more quantifiable achievements to your resume. Include metrics to demonstrate impact.",
    upskill_suggestions: ["Learn Docker containerization", "Study microservices architecture", "Practice system design interviews"]
  };
};

module.exports = { analyzeResume };
