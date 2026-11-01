const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Application = require('../src/models/Application');
const ActivityLog = require('../src/models/ActivityLog');

let mongoServer;

jest.setTimeout(60000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await ActivityLog.deleteMany({});
});

// Helper to register and get token
const registerUser = async (data) => {
  const res = await request(app).post('/api/auth/register').send(data);
  return res;
};

const loginUser = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res;
};

describe('Auth', () => {
  test('POST /api/auth/register - creates a new user', async () => {
    const res = await registerUser({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'candidate',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user.role).toBe('candidate');
    // Password should never be returned
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/register - rejects duplicate email', async () => {
    await registerUser({ name: 'A', email: 'dup@test.com', password: 'password123', role: 'candidate' });
    const res = await registerUser({ name: 'B', email: 'dup@test.com', password: 'password123', role: 'candidate' });
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login - returns token on valid credentials', async () => {
    await registerUser({ name: 'Login', email: 'login@test.com', password: 'password123', role: 'candidate' });
    const res = await loginUser('login@test.com', 'password123');
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login - rejects invalid password', async () => {
    await registerUser({ name: 'Login', email: 'login2@test.com', password: 'password123', role: 'candidate' });
    const res = await loginUser('login2@test.com', 'wrongpassword');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - returns current user', async () => {
    const reg = await registerUser({ name: 'Me', email: 'me@test.com', password: 'password123', role: 'recruiter' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@test.com');
  });
});

describe('Jobs', () => {
  let recruiterToken;
  let candidateToken;

  beforeEach(async () => {
    const r = await registerUser({ name: 'Recruiter', email: 'recruiter@test.com', password: 'password123', role: 'recruiter' });
    recruiterToken = r.body.token;
    const c = await registerUser({ name: 'Candidate', email: 'candidate@test.com', password: 'password123', role: 'candidate' });
    candidateToken = c.body.token;
  });

  test('POST /api/jobs - recruiter can create a job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Dev', description: 'A dev job', jobType: 'full-time' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Dev');
  });

  test('POST /api/jobs - candidate gets 403', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ title: 'Dev', description: 'A dev job' });
    expect(res.status).toBe(403);
  });

  test('GET /api/jobs - public listing', async () => {
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Public Job', description: 'Visible to all' });

    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.total).toBe(1);
  });
});

describe('Applications', () => {
  let recruiterAToken, recruiterBToken, candidateToken, candidateId;
  let jobA;

  beforeEach(async () => {
    const rA = await registerUser({ name: 'RecA', email: 'reca@test.com', password: 'password123', role: 'recruiter' });
    recruiterAToken = rA.body.token;

    const rB = await registerUser({ name: 'RecB', email: 'recb@test.com', password: 'password123', role: 'recruiter' });
    recruiterBToken = rB.body.token;

    const c = await registerUser({ name: 'Cand', email: 'cand@test.com', password: 'password123', role: 'candidate' });
    candidateToken = c.body.token;
    candidateId = c.body.user.id;

    // Create a job for recruiter A
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({ title: 'Test Job', description: 'Test' });
    jobA = jobRes.body;
  });

  test('POST /api/jobs/:jobId/applications - candidate applies with resume', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobA._id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('fake pdf content'), { filename: 'resume.pdf', contentType: 'application/pdf' })
      .field('coverNote', 'I am interested');

    expect(res.status).toBe(201);
    expect(res.body.stage).toBe('Applied');
  });

  test('POST /api/jobs/:jobId/applications - duplicate apply returns 409', async () => {
    await request(app)
      .post(`/api/jobs/${jobA._id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('fake pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    const res = await request(app)
      .post(`/api/jobs/${jobA._id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('fake pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(409);
  });

  test('PATCH /api/applications/:id/stage - recruiter B cannot update recruiter A\'s job applications', async () => {
    // Apply first
    const applyRes = await request(app)
      .post(`/api/jobs/${jobA._id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('fake pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    const res = await request(app)
      .patch(`/api/applications/${applyRes.body._id}/stage`)
      .set('Authorization', `Bearer ${recruiterBToken}`)
      .send({ stage: 'Screening' });

    expect(res.status).toBe(403);
  });

  test('PATCH /api/applications/:id/stage - recruiter A can update their own job applications', async () => {
    const applyRes = await request(app)
      .post(`/api/jobs/${jobA._id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('fake pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    const res = await request(app)
      .patch(`/api/applications/${applyRes.body._id}/stage`)
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({ stage: 'Screening', note: 'Looks good' });

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe('Screening');
  });

  test('PATCH /api/applications/:id/withdraw - candidate can withdraw', async () => {
    const applyRes = await request(app)
      .post(`/api/jobs/${jobA._id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('fake pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    const res = await request(app)
      .patch(`/api/applications/${applyRes.body._id}/withdraw`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe('Rejected');
  });
});
