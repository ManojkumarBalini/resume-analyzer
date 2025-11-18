const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  description: [String]
});

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  graduation_year: {
    type: String,
    required: true
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  technologies: [String]
});

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  file_name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  original_name: {
    type: String,
    required: [true, 'Original file name is required']
  },
  file_size: {
    type: Number,
    required: true
  },
  file_mimetype: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  linkedin_url: {
    type: String,
    default: null
  },
  portfolio_url: {
    type: String,
    default: null
  },
  summary: {
    type: String,
    default: "No summary available"
  },
  work_experience: [workExperienceSchema],
  education: [educationSchema],
  technical_skills: [String],
  soft_skills: [String],
  projects: [projectSchema],
  certifications: [String],
  resume_rating: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  improvement_areas: {
    type: String,
    default: "No specific improvement areas identified"
  },
  upskill_suggestions: [String],
  analysis_date: {
    type: Date,
    default: Date.now
  },
  is_public: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Index for better query performance
resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ name: 'text', email: 'text', summary: 'text' });

// Virtual for formatted date
resumeSchema.virtual('formatted_date').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtual fields are serialized
resumeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Resume', resumeSchema);
