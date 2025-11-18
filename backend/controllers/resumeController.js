const Resume = require('../models/Resume');
const { parsePDF } = require('../services/pdfParser');
const { analyzeResume } = require('../services/geminiService');

// @desc    Upload and analyze resume
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`Processing resume upload for user: ${req.user.id}`);
    console.log(`File details: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Parse PDF
    const text = await parsePDF(req.file.buffer);
    console.log(`PDF parsed successfully. Text length: ${text.length} characters`);

    // Analyze with Gemini
    const analysisResult = await analyzeResume(text);
    console.log('Resume analysis completed');

    // Save to database with user reference
    const resumeData = {
      user: req.user.id,
      file_name: req.file.originalname,
      original_name: req.file.originalname,
      file_size: req.file.size,
      file_mimetype: req.file.mimetype,
      ...analysisResult
    };

    const savedResume = await Resume.create(resumeData);
    console.log(`Resume saved to database with ID: ${savedResume._id}`);

    res.status(201).json({
      success: true,
      data: savedResume
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process resume'
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
      query.$text = { $search: req.query.search };
    }

    // Add filter by skills
    if (req.query.skills) {
      const skills = req.query.skills.split(',');
      query.technical_skills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
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
      error: error.message
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
        error: 'Resume not found or access denied'
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
        error: 'Invalid resume ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = async (req, res) => {
  try {
    let resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found or access denied'
      });
    }

    // Update fields
    const allowedFields = ['name', 'email', 'phone', 'linkedin_url', 'portfolio_url', 'summary', 'is_public', 'tags'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        resume[field] = req.body[field];
      }
    });

    await resume.save();

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get resume statistics
// @route   GET /api/resumes/stats/overview
// @access  Private
const getResumeStats = async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments({ user: req.user.id });
    
    const averageRating = await Resume.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: null, avgRating: { $avg: '$resume_rating' } } }
    ]);
    
    const skillStats = await Resume.aggregate([
      { $match: { user: req.user.id } },
      { $unwind: '$technical_skills' },
      { $group: { _id: '$technical_skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const monthlyStats = await Resume.aggregate([
      { $match: { user: req.user.id } },
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
        averageRating: averageRating[0]?.avgRating || 0,
        topSkills: skillStats,
        monthlyUploads: monthlyStats
      }
    });
  } catch (error) {
    console.error('Error fetching resume stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  getResumeStats
};
