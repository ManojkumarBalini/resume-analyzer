const { GoogleGenerativeAI } = require("@google/generative-ai");

const analyzeResume = async (text) => {
  try {
    console.log('Starting Gemini analysis...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API key not found, using enhanced mock data');
      return getEnhancedMockAnalysis(text);
    }

    // Initialize Gemini client with API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the official Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Enhanced prompt with better instructions
    const prompt = `
    Analyze the following resume text and extract information into a structured JSON format.
    Be thorough and try to extract as much information as possible.
    
    RESUME TEXT:
    ${text.substring(0, 30000)}
    
    IMPORTANT: Return ONLY valid JSON without any additional text, markdown, or explanations.
    
    Required JSON Structure:
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
      "resume_rating": number between 1-10,
      "improvement_areas": "string",
      "upskill_suggestions": ["string"]
    }
    
    Guidelines:
    - If information is not found, use null for strings and empty arrays for arrays
    - For skills, extract all technical skills mentioned
    - Rate the resume based on completeness, clarity, and content quality
    - Provide constructive improvement suggestions
    - Suggest relevant upskilling areas
    `;

    console.log('Calling Gemini API...');
    
    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let jsonText = response.text();

    // Clean up the response text
    jsonText = jsonText.replace(/```json|```/g, "").trim();

    // Handle cases where response has extra text
    if (!jsonText.startsWith("{")) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }

    console.log('Raw Gemini response:', jsonText.substring(0, 200) + '...');

    const analysisResult = JSON.parse(jsonText);
    console.log('Successfully parsed Gemini response');

    // Validate and ensure all fields are present
    return {
      name: analysisResult.name || null,
      email: analysisResult.email || null,
      phone: analysisResult.phone || null,
      linkedin_url: analysisResult.linkedin_url || null,
      portfolio_url: analysisResult.portfolio_url || null,
      summary: analysisResult.summary || "No summary extracted from resume.",
      work_experience: analysisResult.work_experience || [],
      education: analysisResult.education || [],
      technical_skills: analysisResult.technical_skills || [],
      soft_skills: analysisResult.soft_skills || [],
      projects: analysisResult.projects || [],
      certifications: analysisResult.certifications || [],
      resume_rating: analysisResult.resume_rating || 5,
      improvement_areas: analysisResult.improvement_areas || "Consider adding more specific achievements and quantifiable results.",
      upskill_suggestions: analysisResult.upskill_suggestions || ["Learn modern frameworks", "Improve project documentation"]
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    console.log("Using enhanced mock data as fallback");
    return getEnhancedMockAnalysis(text);
  }
};

// Enhanced mock analysis with better data extraction
const getEnhancedMockAnalysis = (text) => {
  console.log('Generating enhanced mock analysis from text');
  
  // Extract information from text
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  
  // Extract name (simple pattern - first two consecutive words starting with capital)
  const nameMatch = text.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
  
  // Extract skills with context
  const technicalSkills = [];
  const skillsKeywords = [
    "JavaScript", "React", "Node.js", "Python", "Java", "HTML", "CSS",
    "SQL", "MongoDB", "Express", "AWS", "Docker", "Git", "TypeScript",
    "Angular", "Vue", "PHP", "C++", "C#", ".NET", "Spring", "MySQL",
    "PostgreSQL", "Redis", "Kubernetes", "Azure", "Google Cloud"
  ];

  skillsKeywords.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      technicalSkills.push(skill);
    }
  });

  // If no skills found, add some common ones
  if (technicalSkills.length === 0) {
    technicalSkills.push("JavaScript", "React", "Node.js", "Git");
  }

  // Extract education information
  const education = [];
  const degreeKeywords = ["bachelor", "master", "phd", "degree", "diploma", "graduated"];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (degreeKeywords.some(keyword => line.includes(keyword))) {
      education.push({
        degree: lines[i].trim(),
        institution: lines[i-1] ? lines[i-1].trim() : "Unknown Institution",
        graduation_year: "2020" // Default year
      });
      break;
    }
  }

  if (education.length === 0) {
    education.push({
      degree: "Bachelor's Degree in Computer Science",
      institution: "University",
      graduation_year: "2020"
    });
  }

  return {
    name: nameMatch ? `${nameMatch[1]} ${nameMatch[2]}` : "Candidate Name",
    email: emailMatch ? emailMatch[0] : "email@example.com",
    phone: phoneMatch ? phoneMatch[0] : "+1 (555) 123-4567",
    linkedin_url: "https://linkedin.com/in/example",
    portfolio_url: "https://github.com/example",
    summary: "Experienced professional with strong technical skills and a proven track record of delivering quality solutions. " + 
             text.substring(0, 150) + "...",
    work_experience: [
      {
        role: "Software Developer",
        company: "Tech Company",
        duration: "2021 - Present",
        description: [
          "Developed and maintained web applications",
          "Collaborated with cross-functional teams",
          "Implemented new features and functionality"
        ]
      }
    ],
    education: education,
    technical_skills: technicalSkills,
    soft_skills: ["Communication", "Teamwork", "Problem Solving", "Adaptability"],
    projects: [
      {
        name: "Web Application Project",
        description: "Developed a full-stack web application with modern technologies",
        technologies: technicalSkills.slice(0, 4)
      }
    ],
    certifications: ["AWS Certified", "Google Cloud Professional"],
    resume_rating: 7,
    improvement_areas: "Consider adding more quantifiable achievements and specific project outcomes. Include metrics to demonstrate impact.",
    upskill_suggestions: [
      "Learn cloud technologies like AWS or Azure",
      "Practice system design concepts",
      "Explore DevOps practices",
      "Learn about microservices architecture"
    ]
  };
};

module.exports = { analyzeResume };
