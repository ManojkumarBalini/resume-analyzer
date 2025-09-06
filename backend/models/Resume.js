const pool = require('../config/database');

const createResumeTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      linkedin_url VARCHAR(255),
      portfolio_url VARCHAR(255),
      summary TEXT,
      work_experience JSONB,
      education JSONB,
      technical_skills JSONB,
      soft_skills JSONB,
      projects JSONB,
      certifications JSONB,
      resume_rating INTEGER,
      improvement_areas TEXT,
      upskill_suggestions JSONB
    );
  `;
  
  await pool.query(query);
};

const saveResume = async (fileName, analysisResult) => {
  const {
    name, email, phone, linkedin_url, portfolio_url, summary,
    work_experience, education, technical_skills, soft_skills,
    projects, certifications, resume_rating, improvement_areas, upskill_suggestions
  } = analysisResult;

  const query = `
    INSERT INTO resumes (
      file_name, name, email, phone, linkedin_url, portfolio_url, summary,
      work_experience, education, technical_skills, soft_skills,
      projects, certifications, resume_rating, improvement_areas, upskill_suggestions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *;
  `;

  const values = [
    fileName, name, email, phone, linkedin_url, portfolio_url, summary,
    JSON.stringify(work_experience), JSON.stringify(education), 
    JSON.stringify(technical_skills), JSON.stringify(soft_skills),
    JSON.stringify(projects), JSON.stringify(certifications), 
    resume_rating, improvement_areas, JSON.stringify(upskill_suggestions)
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const getAllResumes = async () => {
  const query = `
    SELECT id, file_name, uploaded_at, name, email, phone, resume_rating 
    FROM resumes 
    ORDER BY uploaded_at DESC;
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

const getResumeById = async (id) => {
  const query = 'SELECT * FROM resumes WHERE id = $1;';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createResumeTable,
  saveResume,
  getAllResumes,
  getResumeById
};