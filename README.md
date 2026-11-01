# TalentFlow — Modern Job Board & Applicant Tracking System

TalentFlow is a full-stack MERN application that provides a job board with an interactive applicant tracking system (ATS). Candidates can search, filter, and apply for positions with resume uploads and track their status on an activity timeline. Recruiters can post jobs, manage applicants, and drag-and-drop candidates through an ATS Kanban pipeline governed by strict stage transition rules.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Stage Transition Rules](#stage-transition-rules)
- [API Routes Reference](#api-routes-reference)
- [Setup & Installation](#setup--installation)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Mailtrap Configuration](#mailtrap-configuration)
  - [Running the Database & Seeding](#running-the-database--seeding)
  - [Running Server and Client](#running-server-and-client)
  - [Running Automated Tests](#running-automated-tests)
- [Test Seed Credentials](#test-seed-credentials)
- [Design Decisions](#design-decisions)
- [Production Deployment Guide](#production-deployment-guide)

---

## Features

### Candidate Features
- **Job Discovery**: Explore jobs with full-text search, location filtering, employment type toggles, and pagination.
- **Role Details**: View detailed job specifications, compensation brackets, company/recruiter information, and application status.
- **Resume Application**: Upload resumes (PDF, DOC, DOCX up to 5 MB) with cover notes (character counted up to 2000 characters). Duplicate applications to the same job are prevented.
- **My Applications**: View active and historical applications with colored status badges.
- **Application Withdrawal**: Candidate can withdraw an active application (moves to `Rejected` with "Withdrawn by candidate" audit trail).
- **Activity Timeline**: Timestamped history detailing every stage progression and recruiter note.

### Recruiter Features
- **Recruiter Dashboard**: Overview metrics (Total Jobs, Active Openings, Total Applicants), job list with applicant counts, open/close status toggles, and edit/delete actions. Deleting a job cascades and cleans up all related applications and activity logs.
- **Job Posting & Editing**: Create and update postings with validated salary ranges (`salaryMax >= salaryMin`).
- **Interactive Kanban Pipeline**: Drag-and-drop candidate cards across columns (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`) using `@dnd-kit`.
- **Drop Target Validation**: Real-time visual feedback indicating legal and blocked transitions. Illegal drops are blocked with error feedback; optimistic updates automatically roll back if server rejection occurs.
- **Candidate Side Panel**: Slide-over drawer displaying resume view, cover note, stage advance selector with optional timeline note, and chronological activity log.

### Security & Architecture
- **JWT & Role-Based Access Control**: Strict server-side ownership enforcement (`auth` and `requireRole` middleware).
- **Authorized Resume Serving**: Uploaded files are served exclusively through authenticated routes (`/api/uploads/:filename`) rather than exposed as public static folders.
- **Fail-Safe Email Service**: Nodemailer notifications for stage transitions and application confirmations. If email delivery fails, the error is logged without aborting the database transaction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` (10 rounds) |
| **File Uploads** | `multer` (storage abstraction layer for local disk or Cloudinary) |
| **Validation** | `express-validator` |
| **Security** | `helmet`, `cors`, `express-rate-limit` |
| **Notifications** | `nodemailer` (configured for Mailtrap in development) |
| **Testing** | `jest`, `supertest`, `mongodb-memory-server` |
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS |
| **Pipeline Board** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **HTTP Client** | `axios` (with JWT request interceptor and error formatting) |
| **State & Alerts** | React Context (`AuthContext`), `react-hot-toast`, `lucide-react` |
| **Client Tests** | `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |

---

## Monorepo Structure

```text
.
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── api/             # Axios client, auth, jobs, applications
│   │   ├── context/         # AuthContext.jsx
│   │   ├── components/      # Navbar, JobCard, ProtectedRoute, StageBadge,
│   │   │                    # KanbanColumn, KanbanCard, CandidatePanel, Spinner, EmptyState
│   │   ├── pages/           # Jobs, JobDetail, Login, Register, MyApplications,
│   │   │                    # ApplicationDetail, RecruiterDashboard, JobForm, PipelineBoard
│   │   ├── utils/           # pipelineRules.js, validators.js
│   │   ├── test/            # pipelineRules.test.js, validators.test.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env.example
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── uploads/             # Gitignored local uploads directory
│   ├── tests/
│   │   ├── pipeline.test.js # Unit tests for stage transition rules
│   │   └── integration.test.js # Supertest integration tests
│   └── src/
│       ├── config/          # db.js, env.js
│       ├── models/          # User.js, Job.js, Application.js, ActivityLog.js
│       ├── middleware/      # auth.js, requireRole.js, upload.js, errorHandler.js, validate.js
│       ├── routes/          # auth.routes.js, job.routes.js, application.routes.js
│       ├── controllers/     # auth.controller.js, job.controller.js, application.controller.js
│       ├── services/        # pipeline.js, email.js, storage.js
│       ├── utils/           # asyncHandler.js
│       ├── app.js
│       ├── server.js
│       └── seed.js
└── package.json             # Root workspace runner scripts
```

---

## Stage Transition Rules

Stage transitions are managed in `server/src/services/pipeline.js` (with a client-side mirror in `client/src/utils/pipelineRules.js`). The server is always the authoritative source of truth.

| From Stage | Allowed Next Stages | Notes |
|---|---|---|
| **Applied** | `Screening`, `Rejected` | Initial state on application submission |
| **Screening** | `Interview`, `Rejected` | Recruiter initial review passed |
| **Interview** | `Offer`, `Rejected` | Technical & behavioral interviews completed |
| **Offer** | `Hired`, `Rejected` | Offer extended to candidate |
| **Hired** | *None* | **Terminal stage**. Cannot transition out. |
| **Rejected** | *None* | **Terminal stage**. Cannot transition out. |

**Important Rules:**
1. Same-stage moves (e.g. `Applied` -> `Applied`) are rejected with HTTP 400.
2. Skipping stages (e.g. `Applied` -> `Offer`) is rejected with HTTP 400.
3. Every stage change writes an `ActivityLog` entry and sends an email to the candidate.
4. If an email dispatch fails, the error is logged and the stage update succeeds.

---

## API Routes Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register user (`name, email, password, role`) |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user session |

### Jobs (`/api/jobs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/jobs` | Public | Paginated jobs (`search, location, jobType, status, page, limit`) |
| `GET` | `/api/jobs/mine` | Recruiter | Recruiter's jobs with applicant count |
| `GET` | `/api/jobs/:id` | Public | Get single job details |
| `POST` | `/api/jobs` | Recruiter | Create a new job posting |
| `PUT` | `/api/jobs/:id` | Recruiter (Owner) | Update job posting |
| `PATCH` | `/api/jobs/:id/status` | Recruiter (Owner) | Toggle status (`open` or `closed`) |
| `DELETE` | `/api/jobs/:id` | Recruiter (Owner) | Delete job and cascade delete applications |

### Applications (`/api/jobs/:jobId/applications` & `/api/applications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/jobs/:jobId/applications` | Candidate | Submit application with resume and cover note |
| `GET` | `/api/jobs/:jobId/applications` | Recruiter (Owner) | View all applicants for a job |
| `GET` | `/api/applications/mine` | Candidate | View candidate's applications |
| `PATCH` | `/api/applications/:id/withdraw` | Candidate (Owner) | Withdraw application (moves to `Rejected`) |
| `PATCH` | `/api/applications/:id/stage` | Recruiter (Owner) | Update pipeline stage (`stage, note`) |
| `GET` | `/api/applications/:id/activity` | Candidate / Recruiter | Retrieve chronological activity log |
| `GET` | `/api/uploads/:filename` | Authenticated | Secure file download endpoint for resumes |

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [MongoDB](https://www.mongodb.com/) running locally (e.g., `mongodb://localhost:27017/talentflow`) or a MongoDB Atlas URI

### Environment Variables

#### Backend (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/talentflow
MONGO_URI_TEST=mongodb://localhost:27017/talentflow_test
JWT_SECRET=super_secret_jwt_key_talentflow_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
EMAIL_FROM="TalentFlow <no-reply@talentflow.dev>"
```

#### Frontend (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Mailtrap Configuration
To view email notifications in development:
1. Create a free account at [Mailtrap.io](https://mailtrap.io/).
2. Under **Email Testing** > **Inboxes**, select **SMTP Settings** > **Show Credentials**.
3. Copy `Host`, `Port`, `Username`, and `Password` into `server/.env`.
4. If SMTP credentials are left blank, the server logs a notice and safely skips dispatch without throwing errors.

---

## Running the Database & Seeding

Ensure MongoDB is running, then execute the seed script:

```bash
# From repository root:
npm run seed

# Or directly in server/:
cd server
npm run seed
```

The seed script will populate 2 recruiters, 5 candidates, 10 jobs, and 15 applications with realistic activity timelines.

---

## Running Server and Client

### Option 1: From Root (Runs Both Concurrently)
```bash
# Starts both the backend server and frontend Vite client simultaneously
npm run dev
```

You can also run them individually if preferred:
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

### Option 2: In Separate Folders
```bash
# Start backend on http://localhost:5000
cd server
npm run dev

# Start frontend on http://localhost:5173
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## Running Automated Tests

Both test suites can be executed independently or simultaneously:

```bash
# Run both backend and frontend test suites from root
npm test

# Run backend unit and integration tests (35 tests)
npm run test:server

# Run frontend tests (13 tests)
npm run test:client
```

---

## Test Seed Credentials

All test accounts share the password: **`password123`**

### Recruiters
- `alice@talentflow.dev`
- `bob@talentflow.dev`

### Candidates
- `charlie@example.com`
- `diana@example.com`
- `eve@example.com`
- `frank@example.com`
- `grace@example.com`

*(Tip: The Sign In page includes quick one-click demo login buttons for Alice and Charlie).*

---

## Design Decisions

Where the specifications were open to implementation choices:

1. **Storage Abstraction (`server/src/services/storage.js`)**:
   File storage is abstracted via `storageEngine`, `getFileUrl`, and `getFilePath`. The current implementation stores files in `server/uploads/`. To switch to Cloudinary or AWS S3, update this single module without changing any controller code.

2. **Authorized File Serving (`/api/uploads/:filename`)**:
   Rather than serving resumes through `express.static`, files are served through an authenticated route protected by the `auth` middleware. On the client side, `openAuthorizedFile` requests the file using Axios with the Bearer token, receives the binary blob, and opens it safely via an ephemeral Object URL.

3. **Optimistic Drag-and-Drop Updates with Rollback**:
   The Kanban board updates the UI state immediately when a valid drop occurs. If the server responds with an error (e.g. network interruption or permission change), the state automatically rolls back to the prior position and displays an alert toast.

4. **Cascading Job Deletions**:
   When a recruiter deletes a job posting, all associated candidate applications and activity logs are automatically removed to prevent orphaned documents in the database.

5. **Client Drop Validation**:
   `KanbanColumn` inspects `activeApplication` in real time. If moving to a target column violates the pipeline rules, the column receives disabled styling (`opacity-50 border-dashed border-rose-200`) and the drop is intercepted and blocked before an unnecessary network call is made.

6. **Candidate Panel Slide-Over**:
   Clicking any card in the Kanban board opens a slide-over drawer allowing recruiters to read the candidate's cover note, download their resume, review the complete timestamped activity timeline, and advance stages with an optional note.

---

## Production Deployment Guide

### 1. Database (MongoDB Atlas)
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write permissions.
3. Whitelist `0.0.0.0/0` (or your cloud provider's outgoing IP range) in Network Access.
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/talentflow?retryWrites=true&w=majority`.

### 2. Backend (Render / Railway)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=5000` (or assigned by host)
  - `MONGO_URI=<your MongoDB Atlas connection string>`
  - `JWT_SECRET=<strong random secret>`
  - `CLIENT_URL=https://your-frontend.vercel.app`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- *Note for multi-instance deployments*: Swap the local disk storage module with Cloudinary or S3 using the abstraction in `storage.js`.

### 3. Frontend (Vercel / Netlify)
- **Root Directory**: `client`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL=https://your-backend.onrender.com/api`
- **SPA Rewrites**: Add a `vercel.json` or Netlify `_redirects` (`/* /index.html 200`) to support client-side routing on reload.
