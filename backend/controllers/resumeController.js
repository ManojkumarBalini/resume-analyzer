const Resume = require('../models/Resume');
const { parsePDF } = require('../services/pdfParser');
const { analyzeResume } = require('../services/geminiService');

// @desc    Upload and analyze resume
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    console.log('=== UPLOAD RESUME REQUEST STARTED ===');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a PDF file.'
      });
    }

    console.log(`Processing resume for user: ${req.user.id}`);
    console.log(`File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Step 1: Parse PDF
    let text;
    try {
      console.log('Step 1: Parsing PDF...');
      text = await parsePDF(req.file.buffer);
      console.log(`✓ PDF parsed successfully. Text length: ${text.length} characters`);
      
      if (!text || text.length < 50) {
        throw new Error('PDF appears to be empty or contains very little text');
      }
    } catch (parseError) {
      console.error('✗ PDF parsing failed:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse PDF file. The file may be corrupted or not a valid PDF.'
      });
    }

    // Step 2: Analyze with Gemini
    let analysisResult;
    try {
      console.log('Step 2: Analyzing resume with Gemini AI...');
      analysisResult = await analyzeResume(text);
      console.log('✓ Resume analysis completed successfully');
      console.log('Analysis result sample:', {
        name: analysisResult.name,
        email: analysisResult.email,
        skills: analysisResult.technical_skills?.length
      });
    } catch (analysisError) {
      console.error('✗ Analysis failed:', analysisError);
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze resume content. Please try again.'
      });
    }

    // Validate analysis result
    if (!analysisResult || typeof analysisResult !== 'object') {
      console.error('✗ Invalid analysis result:', analysisResult);
      return res.status(500).json({
        success: false,
        error: 'Analysis returned invalid result'
      });
    }

    // Step 3: Save to database
    try {
      console.log('Step 3: Saving to database...');
      const resumeData = {
        user: req.user.id,
        file_name: req.file.originalname,
        original_name: req.file.originalname,
        file_size: req.file.size,
        file_mimetype: req.file.mimetype,
        ...analysisResult
      };

      const savedResume = await Resume.create(resumeData);
      console.log(`✓ Resume saved to database with ID: ${savedResume._id}`);

      res.status(201).json({
        success: true,
        message: 'Resume analyzed successfully',
        data: savedResume
      });
      
    } catch (dbError) {
      console.error('✗ Database save failed:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save resume to database'
      });
    }

  } catch (error) {
    console.error('=== UPLOAD RESUME ERROR ===', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while processing your resume'
    });
  }
};

// @desc    Get all resumes for logged in user
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query for user's resumes
    let query = { user: req.user.id };

    // Add search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { 'technical_skills': { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const resumes = await Resume.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('file_name original_name name email phone resume_rating createdAt updatedAt');

    const total = await Resume.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: resumes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resumes'
    });
  }
};

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resume'
    });
  }
};

// @desc    Get resume statistics
// @route   GET /api/resumes/stats/overview
// @access  Private
const getResumeStats = async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments({ user: req.user.id });
    
    const averageRatingResult = await Resume.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, avgRating: { $avg: '$resume_rating' } } }
    ]);
    
    const skillStats = await Resume.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: '$technical_skills' },
      { $group: { _id: '$technical_skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const monthlyStats = await Resume.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        totalResumes,
        averageRating: averageRatingResult[0]?.avgRating || 0,
        topSkills: skillStats,
        monthlyUploads: monthlyStats
      }
    });
  } catch (error) {
    console.error('Error fetching resume stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResume,
  getResumeStats
};
