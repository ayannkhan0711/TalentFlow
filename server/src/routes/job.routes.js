const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  getMyJobs,
} = require('../controllers/job.controller');
const {
  applyToJob,
  getJobApplications,
} = require('../controllers/application.controller');
const upload = require('../middleware/upload');

const router = express.Router();

// Public
router.get('/', getJobs);

// Recruiter's own jobs — must be before /:id so "mine" isn't treated as an id
router.get('/mine', auth, requireRole('recruiter'), getMyJobs);

// Public
router.get('/:id', getJob);

// Recruiter only
router.post(
  '/',
  auth,
  requireRole('recruiter'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('jobType')
      .optional()
      .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote'])
      .withMessage('Invalid job type'),
    body('salaryMin').optional().isNumeric().withMessage('salaryMin must be a number'),
    body('salaryMax').optional().isNumeric().withMessage('salaryMax must be a number'),
  ],
  validate,
  createJob
);

router.put(
  '/:id',
  auth,
  requireRole('recruiter'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  ],
  validate,
  updateJob
);

router.patch('/:id/status', auth, requireRole('recruiter'), updateJobStatus);

router.delete('/:id', auth, requireRole('recruiter'), deleteJob);

// Applications on a job
router.post(
  '/:jobId/applications',
  auth,
  requireRole('candidate'),
  upload.single('resume'),
  applyToJob
);

router.get(
  '/:jobId/applications',
  auth,
  requireRole('recruiter'),
  getJobApplications
);

module.exports = router;
