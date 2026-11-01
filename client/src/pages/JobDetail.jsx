import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJobByIdApi } from '../api/jobs';
import { applyToJobApi, getMyApplicationsApi } from '../api/applications';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import StageBadge from '../components/StageBadge';
import { validateResumeFile } from '../utils/validators';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isCandidate, isRecruiter } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingApplication, setExistingApplication] = useState(null);

  // Apply form state
  const [resumeFile, setResumeFile] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    const fetchJobAndApplication = async () => {
      setLoading(true);
      try {
        const jobData = await getJobByIdApi(id);
        setJob(jobData);

        // If authenticated candidate, check if already applied
        if (isAuthenticated && isCandidate) {
          try {
            const apps = await getMyApplicationsApi();
            const existing = (apps.data || []).find((a) => a.job?._id === id || a.job === id);
            if (existing) {
              setExistingApplication(existing);
            }
          } catch (e) {
            console.error('Could not check existing applications:', e);
          }
        }
      } catch (err) {
        toast.error('Job not found or failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndApplication();
  }, [id, isAuthenticated, isCandidate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      setResumeFile(null);
    } else {
      setFileError('');
      setResumeFile(file);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setFileError('Please select a resume file (PDF, DOC, or DOCX)');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (coverNote.trim()) {
        formData.append('coverNote', coverNote.trim());
      }

      const res = await applyToJobApi(id, formData);
      toast.success('Application submitted successfully!');
      setExistingApplication(res);
    } catch (err) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Job Not Found</h2>
        <p className="text-slate-500 mt-2">The job you are looking for does not exist or has been removed.</p>
        <Link
          to="/jobs"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `From ${formatter.format(min)}`;
    return `Up to ${formatter.format(max)}`;
  };

  const salaryString = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Job Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {job.jobType && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {job.jobType}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    job.status === 'open'
                      ? 'bg-emerald-100/70 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      job.status === 'open' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {job.status === 'open' ? 'Actively Hiring' : 'Closed'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title}
              </h1>

              {job.recruiter?.name && (
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Posted by <span className="text-slate-800 font-semibold">{job.recruiter.name}</span>
                </p>
              )}

              {/* Job Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-sm">
                {job.location && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Location</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {job.location}
                    </span>
                  </div>
                )}
                {salaryString && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Compensation</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      {salaryString}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Posted On</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(job.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Job Description */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">About the Role</h3>
                <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {job.description}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Apply Form / Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Apply for this position</h3>

              {job.status === 'closed' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm text-slate-600">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  This job opening has been marked as <strong>closed</strong> and is no longer accepting new applications.
                </div>
              ) : existingApplication ? (
                <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-bold text-emerald-900 text-base">Application Submitted!</h4>
                  <p className="text-xs text-emerald-700 mt-1 mb-4">
                    You have already applied to this position.
                  </p>
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 block mb-1">Current Status</span>
                    <StageBadge stage={existingApplication.stage} size="lg" />
                  </div>
                  <Link
                    to={`/my-applications/${existingApplication._id}`}
                    className="block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    View Timeline
                  </Link>
                </div>
              ) : !isAuthenticated ? (
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-600">
                    Sign in to your candidate account to submit your resume and track application progress.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: `/jobs/${job._id}` }}
                    className="block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                  >
                    Sign In to Apply
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Don't have an account? Sign up
                  </Link>
                </div>
              ) : isRecruiter ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800">
                  <User className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                  You are logged in as a <strong>Recruiter</strong>. Recruiters cannot apply to job postings.
                </div>
              ) : (
                /* Candidate Apply Form */
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Upload Resume *
                    </label>
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="resume-upload"
                      />
                      {resumeFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold">
                          <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">
                            Click to upload or drag file
                          </p>
                          <p className="text-[11px] text-slate-400">PDF, DOC, DOCX (Max 5 MB)</p>
                        </div>
                      )}
                    </div>
                    {fileError && (
                      <p className="text-xs text-rose-600 mt-1.5 font-medium">{fileError}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Cover Note (Optional)
                      </label>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {coverNote.length}/2000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={coverNote}
                      maxLength={2000}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Why are you a great fit for this position?"
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
