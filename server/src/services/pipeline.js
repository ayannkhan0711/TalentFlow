const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const { sendStageChangeEmail } = require('./email');

/**
 * Allowed stage transitions. Hired and Rejected are terminal — no outbound edges.
 * This map is the single source of truth for transition rules.
 */
const ALLOWED_TRANSITIONS = {
  Applied: ['Screening', 'Rejected'],
  Screening: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Hired', 'Rejected'],
  Hired: [],
  Rejected: [],
};

/**
 * Validates whether a stage transition is allowed.
 * Returns { valid: true } or { valid: false, message: string }.
 */
const validateTransition = (fromStage, toStage) => {
  if (fromStage === toStage) {
    return { valid: false, message: `Application is already in the "${fromStage}" stage.` };
  }

  const allowed = ALLOWED_TRANSITIONS[fromStage];
  if (!allowed) {
    return { valid: false, message: `Unknown stage "${fromStage}".` };
  }

  if (allowed.length === 0) {
    return { valid: false, message: `"${fromStage}" is a terminal stage. No further transitions allowed.` };
  }

  if (!allowed.includes(toStage)) {
    return {
      valid: false,
      message: `Cannot move from "${fromStage}" to "${toStage}". Allowed: ${allowed.join(', ')}.`,
    };
  }

  return { valid: true };
};

/**
 * Executes a stage transition:
 *  1. Updates the application stage
 *  2. Creates an ActivityLog entry
 *  3. Sends an email notification (non-blocking; failures are logged)
 *
 * @param {Object} params
 * @param {string} params.applicationId - Application ObjectId
 * @param {string} params.newStage - Target stage
 * @param {Object} params.changedBy - User performing the change
 * @param {string} [params.note] - Optional note
 * @returns {Object} Updated application
 */
const transitionStage = async ({ applicationId, newStage, changedBy, note }) => {
  const application = await Application.findById(applicationId)
    .populate('candidate')
    .populate({ path: 'job', select: 'title recruiter' });

  if (!application) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }

  const fromStage = application.stage;
  const validation = validateTransition(fromStage, newStage);
  if (!validation.valid) {
    const err = new Error(validation.message);
    err.statusCode = 400;
    throw err;
  }

  // 1. Update stage
  application.stage = newStage;
  await application.save();

  // 2. Create activity log
  await ActivityLog.create({
    application: application._id,
    fromStage,
    toStage: newStage,
    changedBy: changedBy._id || changedBy,
    note: note || undefined,
  });

  // 3. Send email (fire-and-forget; errors are logged inside)
  sendStageChangeEmail(application.candidate, application.job, newStage);

  return application;
};

module.exports = { ALLOWED_TRANSITIONS, validateTransition, transitionStage };
