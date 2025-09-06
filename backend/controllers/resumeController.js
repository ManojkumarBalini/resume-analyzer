const { parsePDF } = require('../services/pdfParser');
const { analyzeResume } = require('../services/geminiService');
const { saveResume, getAllResumes, getResumeById } = require('../models/Resume');

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse PDF
    const text = await parsePDF(req.file.buffer);
    
    // Analyze with Gemini
    const analysisResult = await analyzeResume(text);
    
    // Save to database
    const savedResume = await saveResume(req.file.originalname, analysisResult);
    
    res.json(savedResume);
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: error.message });
  }
};

const getResumes = async (req, res) => {
  try {
    const resumes = await getAllResumes();
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: error.message });
  }
};

const getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await getResumeById(id);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResume
};