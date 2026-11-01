const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const Job = require('../models/Job');
const { getFileUrl } = require('../services/storage');
const { transitionStage } = require('../services/pipeline');
const { sendApplicationConfirmation } = require('../services/email');
const asyncHandler = require('../utils/asyncHandler');

exports.applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.status === 'closed') {
    return res.status(400).json({ message: 'This job is no longer accepting applications' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Resume file is required' });
  }

  const resumeUrl = getFileUrl(req.file.filename);
  const { coverNote } = req.body;

  try {
    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      resumeUrl,
      coverNote,
    });

    // Log the initial "Applied" activity
    await ActivityLog.create({
      application: application._id,
      fromStage: null,
      toStage: 'Applied',
      changedBy: req.user._id,
      note: 'Application submitted',
    });

    // Send confirmation email (non-blocking)
    sendApplicationConfirmation(req.user, job);

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }
    throw err;
  }
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidate: req.user._id })
    .populate('job', 'title location jobType status')
    .sort({ createdAt: -1 });

  res.json({ data: applications });
});

exports.withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  if (application.candidate.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (application.stage === 'Hired' || application.stage === 'Rejected') {
    return res.status(400).json({ message: `Cannot withdraw. Application is already "${application.stage}".` });
  }

  const fromStage = application.stage;
  application.stage = 'Rejected';
  await application.save();

  await ActivityLog.create({
    application: application._id,
    fromStage,
    toStage: 'Rejected',
    changedBy: req.user._id,
    note: 'Withdrawn by candidate',
  });

  res.json(application);
});

exports.getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.recruiter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view applications for this job' });
  }

  const { stage } = req.query;
  const query = { job: job._id };
  if (stage) {
    query.stage = stage;
  }

  const applications = await Application.find(query)
    .populate('candidate', 'name email')
    .sort({ createdAt: -1 });

  res.json({ data: applications });
});

exports.updateApplicationStage = asyncHandler(async (req, res) => {
  const { stage, note } = req.body;

  // Verify recruiter owns the job
  const application = await Application.findById(req.params.id).populate('job', 'recruiter');
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  if (application.job.recruiter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this application' });
  }

  const updated = await transitionStage({
    applicationId: application._id,
    newStage: stage,
    changedBy: req.user,
    note,
  });

  res.json(updated);
});

exports.getApplicationActivity = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('job', 'recruiter');
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  // Allow the candidate who owns the application OR the recruiter who owns the job
  const isCandidate = application.candidate.toString() === req.user._id.toString();
  const isRecruiter = application.job.recruiter.toString() === req.user._id.toString();
  if (!isCandidate && !isRecruiter) {
    return res.status(403).json({ message: 'Not authorized to view this activity log' });
  }

  const logs = await ActivityLog.find({ application: application._id })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 });

  res.json({ data: logs });
});
