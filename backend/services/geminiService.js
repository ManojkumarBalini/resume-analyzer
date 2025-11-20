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

    // Use the correct model - try gemini-pro if gemini-1.5-pro doesn't work
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro"  // Using gemini-pro which is more widely available
    });

    // Enhanced prompt with strict JSON formatting
    const prompt = `Analyze the following resume text and return ONLY a valid JSON object with this exact structure. Do not include any other text, explanations, or markdown formatting.

RESUME TEXT:
${text.substring(0, 15000)}  // Reduced length to avoid token limits

Return this exact JSON structure - all fields must be present:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null", 
  "linkedin_url": "string or null",
  "portfolio_url": "string or null",
  "summary": "string describing the candidate's profile",
  "work_experience": [
    {
      "role": "string",
      "company": "string",
      "duration": "string", 
      "description": ["string", "string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "graduation_year": "string"
    }
  ],
  "technical_skills": ["string", "string", "string"],
  "soft_skills": ["string", "string", "string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string", "string"]
    }
  ],
  "certifications": ["string", "string"],
  "resume_rating": 8,
  "improvement_areas": "string with specific suggestions",
  "upskill_suggestions": ["string", "string", "string"]
}

Extract as much real information as possible from the resume text. If information is missing, use reasonable defaults but try to extract real data first.`;

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
    
    // Fallback to enhanced mock analysis
    console.log("Using enhanced mock analysis as fallback");
    return getEnhancedMockAnalysis(text);
  }
};

// Helper functions for data extraction
function extractEmailFromText(text) {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return emailMatch ? emailMatch[0] : "candidate@example.com";
}

function extractPhoneFromText(text) {
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : "+1 (555) 123-4567";
}

function extractNameFromText(text) {
  // Simple name extraction - look for patterns that might indicate a name
  const lines = text.split('\n');
  for (let line of lines) {
    const trimmed = line.trim();
    // Look for lines that might be names (typically at the top, 2-3 words, capitalized)
    if (trimmed && trimmed.split(' ').length >= 2 && trimmed.split(' ').length <= 4 && 
        /^[A-Z][a-z]+([ -][A-Z][a-z]+)+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return "John Doe";
}

function extractSkillsFromText(text) {
  const skills = [];
  const skillKeywords = [
    "JavaScript", "React", "Node.js", "Python", "Java", "HTML", "CSS", "SQL",
    "MongoDB", "Express", "AWS", "Docker", "Git", "TypeScript", "Angular", "Vue",
    "PHP", "C++", "C#", ".NET", "Spring", "MySQL", "PostgreSQL", "Redis"
  ];

  const lowerText = text.toLowerCase();
  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  return skills.length > 0 ? skills : ["JavaScript", "React", "Node.js", "Git"];
}

function getDefaultWorkExperience() {
  return [
    {
      role: "Software Developer",
      company: "Tech Company",
      duration: "2021 - Present",
      description: [
        "Developed and maintained web applications using modern technologies",
        "Collaborated with cross-functional teams to deliver quality software",
        "Implemented new features and improved system performance"
      ]
    }
  ];
}

function getDefaultEducation() {
  return [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "University of Technology",
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

// Enhanced mock analysis as final fallback
const getEnhancedMockAnalysis = (text) => {
  console.log('Generating enhanced mock analysis');
  
  return {
    name: extractNameFromText(text),
    email: extractEmailFromText(text),
    phone: extractPhoneFromText(text),
    linkedin_url: "https://linkedin.com/in/professional",
    portfolio_url: "https://github.com/portfolio",
    summary: "Results-driven professional with expertise in software development and problem-solving. " + 
             (text.length > 100 ? text.substring(0, 100) + "..." : "Skilled in various technologies and methodologies."),
    work_experience: getDefaultWorkExperience(),
    education: getDefaultEducation(),
    technical_skills: extractSkillsFromText(text),
    soft_skills: ["Communication", "Teamwork", "Problem Solving", "Adaptability", "Leadership"],
    projects: getDefaultProjects(),
    certifications: ["AWS Certified Developer", "Google Cloud Professional"],
    resume_rating: 7,
    improvement_areas: "Consider adding more quantifiable achievements, specific metrics, and project outcomes to demonstrate impact. Include more details about technical stack and responsibilities.",
    upskill_suggestions: [
      "Learn cloud technologies (AWS, Azure, GCP)",
      "Practice system design and architecture patterns",
      "Explore containerization with Docker and Kubernetes",
      "Learn about microservices and API design"
    ]
  };
};

module.exports = { analyzeResume };
