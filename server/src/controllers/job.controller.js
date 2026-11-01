const Job = require('../models/Job');
const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');

exports.getJobs = asyncHandler(async (req, res) => {
  const { search, location, jobType, status, page = 1, limit = 10 } = req.query;
  const query = {};

  if (search) {
    query.$text = { $search: search };
  }
  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }
  if (jobType) {
    query.jobType = jobType;
  }
  if (status) {
    query.status = status;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Job.find(query)
      .populate('recruiter', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Job.countDocuments(query),
  ]);

  res.json({
    data,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('recruiter', 'name email');
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json(job);
});

exports.createJob = asyncHandler(async (req, res) => {
  const { title, description, location, jobType, salaryMin, salaryMax, currency } = req.body;

  const job = await Job.create({
    title,
    description,
    location,
    jobType,
    salaryMin,
    salaryMax,
    currency,
    recruiter: req.user._id,
  });

  res.status(201).json(job);
});

exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.recruiter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this job' });
  }

  const allowedFields = ['title', 'description', 'location', 'jobType', 'salaryMin', 'salaryMax', 'currency'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();
  res.json(job);
});

exports.updateJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.recruiter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this job' });
  }

  const { status } = req.body;
  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "open" or "closed"' });
  }

  job.status = status;
  await job.save();
  res.json(job);
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.recruiter.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this job' });
  }

  // Delete all related applications and their activity logs
  const applications = await Application.find({ job: job._id });
  const appIds = applications.map((a) => a._id);
  await ActivityLog.deleteMany({ application: { $in: appIds } });
  await Application.deleteMany({ job: job._id });
  await Job.findByIdAndDelete(job._id);

  res.json({ message: 'Job and related applications deleted' });
});

exports.getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });

  // Get applicant counts for each job
  const jobIds = jobs.map((j) => j._id);
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id.toString()] = c.count;
  });

  const data = jobs.map((job) => ({
    ...job.toObject(),
    applicantCount: countMap[job._id.toString()] || 0,
  }));

  res.json({ data });
});
