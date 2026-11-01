const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const ActivityLog = require('./models/ActivityLog');

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const seed = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed script cannot run in production!');
    process.exit(1);
  }

  await connectDB();
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await ActivityLog.deleteMany({});
  await Application.deleteMany({});
  await Job.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared existing data.\n');

  // Create recruiters
  const recruiters = await User.create([
    { name: 'Alice Recruiter', email: 'alice@talentflow.dev', password: 'password123', role: 'recruiter' },
    { name: 'Bob Recruiter', email: 'bob@talentflow.dev', password: 'password123', role: 'recruiter' },
  ]);

  // Create candidates
  const candidates = await User.create([
    { name: 'Charlie Candidate', email: 'charlie@example.com', password: 'password123', role: 'candidate' },
    { name: 'Diana Candidate', email: 'diana@example.com', password: 'password123', role: 'candidate' },
    { name: 'Eve Candidate', email: 'eve@example.com', password: 'password123', role: 'candidate' },
    { name: 'Frank Candidate', email: 'frank@example.com', password: 'password123', role: 'candidate' },
    { name: 'Grace Candidate', email: 'grace@example.com', password: 'password123', role: 'candidate' },
  ]);

  console.log(`Created ${recruiters.length} recruiters and ${candidates.length} candidates.\n`);

  // Create jobs
  const jobsData = [
    { title: 'Senior React Developer', description: 'We are looking for an experienced React developer to lead our frontend team. You will architect scalable web applications and mentor junior developers.', location: 'San Francisco, CA', jobType: 'full-time', salaryMin: 130000, salaryMax: 180000, recruiter: recruiters[0]._id },
    { title: 'Backend Engineer (Node.js)', description: 'Join our backend team to build robust APIs and microservices. Experience with Node.js, MongoDB, and cloud infrastructure is required.', location: 'New York, NY', jobType: 'full-time', salaryMin: 120000, salaryMax: 160000, recruiter: recruiters[0]._id },
    { title: 'UX/UI Design Intern', description: 'Great opportunity for design students to gain real-world experience. Work alongside our design team on user research and prototyping.', location: 'Austin, TX', jobType: 'internship', salaryMin: 25, salaryMax: 35, currency: 'USD', recruiter: recruiters[0]._id },
    { title: 'DevOps Engineer', description: 'Manage our CI/CD pipelines, container orchestration with Kubernetes, and cloud infrastructure on AWS.', location: 'Remote', jobType: 'remote', salaryMin: 110000, salaryMax: 150000, recruiter: recruiters[0]._id },
    { title: 'Product Manager', description: 'Drive product strategy and roadmap for our SaaS platform. Work cross-functionally with engineering, design, and marketing.', location: 'Seattle, WA', jobType: 'full-time', salaryMin: 140000, salaryMax: 190000, recruiter: recruiters[0]._id },
    { title: 'Full Stack Developer', description: 'Build features end-to-end using React and Node.js. Strong problem-solving skills and experience with agile methodologies required.', location: 'Chicago, IL', jobType: 'full-time', salaryMin: 100000, salaryMax: 140000, recruiter: recruiters[1]._id },
    { title: 'Data Analyst (Part-time)', description: 'Analyze user behavior data and create dashboards. Proficiency in SQL, Python, and data visualization tools.', location: 'Denver, CO', jobType: 'part-time', salaryMin: 40000, salaryMax: 60000, recruiter: recruiters[1]._id },
    { title: 'Mobile Developer (React Native)', description: 'Develop and maintain our cross-platform mobile app using React Native. Experience with app store deployment required.', location: 'Miami, FL', jobType: 'contract', salaryMin: 90000, salaryMax: 130000, recruiter: recruiters[1]._id },
    { title: 'Technical Writer', description: 'Create developer documentation, API guides, and tutorials. Excellent writing skills and technical understanding required.', location: 'Remote', jobType: 'remote', salaryMin: 70000, salaryMax: 95000, recruiter: recruiters[1]._id },
    { title: 'QA Engineer', description: 'Design and execute test plans for web and mobile applications. Experience with automated testing frameworks preferred.', location: 'Portland, OR', jobType: 'full-time', salaryMin: 85000, salaryMax: 115000, status: 'closed', recruiter: recruiters[1]._id },
  ];

  const jobs = await Job.create(jobsData);
  console.log(`Created ${jobs.length} jobs.\n`);

  // Create applications with varied stages and activity logs
  const applicationConfigs = [
    { jobIdx: 0, candidateIdx: 0, targetStage: 'Interview', notes: ['Great resume', 'Phone screen passed'] },
    { jobIdx: 0, candidateIdx: 1, targetStage: 'Screening', notes: ['Interesting background'] },
    { jobIdx: 0, candidateIdx: 2, targetStage: 'Rejected', notes: ['Not enough experience'] },
    { jobIdx: 1, candidateIdx: 0, targetStage: 'Offer', notes: ['Strong skills', 'Technical test passed', 'Final round excellent'] },
    { jobIdx: 1, candidateIdx: 3, targetStage: 'Applied', notes: [] },
    { jobIdx: 2, candidateIdx: 4, targetStage: 'Screening', notes: ['Portfolio review needed'] },
    { jobIdx: 3, candidateIdx: 1, targetStage: 'Hired', notes: ['Great fit', 'Technical pass', 'Team interview great', 'Offer accepted'] },
    { jobIdx: 3, candidateIdx: 2, targetStage: 'Interview', notes: ['Skills match', 'Moving forward'] },
    { jobIdx: 4, candidateIdx: 3, targetStage: 'Applied', notes: [] },
    { jobIdx: 5, candidateIdx: 0, targetStage: 'Screening', notes: ['Reviewed portfolio'] },
    { jobIdx: 5, candidateIdx: 4, targetStage: 'Rejected', notes: ['Position filled'] },
    { jobIdx: 6, candidateIdx: 1, targetStage: 'Applied', notes: [] },
    { jobIdx: 7, candidateIdx: 2, targetStage: 'Offer', notes: ['Contract terms discussed', 'Technical cleared', 'Making an offer'] },
    { jobIdx: 8, candidateIdx: 3, targetStage: 'Interview', notes: ['Writing sample excellent', 'Moving to interview'] },
    { jobIdx: 8, candidateIdx: 4, targetStage: 'Applied', notes: [] },
  ];

  // Build the stage path to reach a target stage
  const stagePath = {
    Applied: ['Applied'],
    Screening: ['Applied', 'Screening'],
    Interview: ['Applied', 'Screening', 'Interview'],
    Offer: ['Applied', 'Screening', 'Interview', 'Offer'],
    Hired: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
    Rejected: ['Applied', 'Rejected'],
  };

  let appCount = 0;
  for (const cfg of applicationConfigs) {
    const job = jobs[cfg.jobIdx];
    const candidate = candidates[cfg.candidateIdx];
    const recruiter = job.recruiter;
    const path = stagePath[cfg.targetStage];
    const finalStage = path[path.length - 1];

    const application = await Application.create({
      job: job._id,
      candidate: candidate._id,
      resumeUrl: `/api/uploads/seed-resume-${appCount}.pdf`,
      coverNote: `I am very interested in the ${job.title} position. My skills and experience make me a strong candidate.`,
      stage: finalStage,
    });

    // Create activity logs for the full path
    let baseDate = new Date('2024-09-01');
    for (let i = 0; i < path.length; i++) {
      const fromStage = i === 0 ? null : path[i - 1];
      const toStage = path[i];
      const note = i === 0 ? 'Application submitted' : cfg.notes[i - 1] || undefined;

      await ActivityLog.create({
        application: application._id,
        fromStage,
        toStage,
        changedBy: i === 0 ? candidate._id : recruiter,
        note,
        createdAt: new Date(baseDate.getTime() + i * 3 * 24 * 60 * 60 * 1000),
      });
    }
    appCount++;
  }

  console.log(`Created ${appCount} applications with activity logs.\n`);

  console.log('='.repeat(50));
  console.log('🎉 Seed complete! Test credentials:');
  console.log('='.repeat(50));
  console.log('\nRecruiters:');
  console.log('  alice@talentflow.dev / password123');
  console.log('  bob@talentflow.dev   / password123');
  console.log('\nCandidates:');
  console.log('  charlie@example.com  / password123');
  console.log('  diana@example.com    / password123');
  console.log('  eve@example.com      / password123');
  console.log('  frank@example.com    / password123');
  console.log('  grace@example.com    / password123');
  console.log('='.repeat(50));

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
