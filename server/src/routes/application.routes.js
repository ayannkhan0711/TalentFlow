const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getMyApplications,
  withdrawApplication,
  updateApplicationStage,
  getApplicationActivity,
} = require('../controllers/application.controller');

const router = express.Router();

// Candidate: get own applications
router.get('/mine', auth, requireRole('candidate'), getMyApplications);

// Candidate: withdraw
router.patch('/:id/withdraw', auth, requireRole('candidate'), withdrawApplication);

// Recruiter: update stage
router.patch(
  '/:id/stage',
  auth,
  requireRole('recruiter'),
  [
    body('stage')
      .isIn(['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'])
      .withMessage('Invalid stage'),
  ],
  validate,
  updateApplicationStage
);

// Both: activity log
router.get('/:id/activity', auth, getApplicationActivity);

module.exports = router;
