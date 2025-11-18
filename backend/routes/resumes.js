const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  uploadResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  getResumeStats
} = require('../controllers/resumeController');

// Protect all routes
router.use(protect);

router.post('/upload', upload, handleUploadError, uploadResume);
router.get('/', getResumes);
router.get('/stats/overview', getResumeStats);
router.get('/:id', getResume);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

module.exports = router;
