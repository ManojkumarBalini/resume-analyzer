const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadResume, getResumes, getResume } = require('../controllers/resumeController');

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/:id', getResume);

module.exports = router;