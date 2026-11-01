import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyJobsApi, updateJobStatusApi, deleteJobApi } from '../api/jobs';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import {
  Briefcase,
  Users,
  PlusCircle,
  Kanban,
  Edit3,
  Trash2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Power,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getMyJobsApi();
      setJobs(res.data || []);
    } catch (err) {
      toast.error('Failed to load recruiter jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    setTogglingId(jobId);
    try {
      await updateJobStatusApi(jobId, nextStatus);
      toast.success(`Job marked as ${nextStatus}`);
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status: nextStatus } : j))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update job status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This will also permanently delete all associated candidate applications and activity logs.`
    );
    if (!confirmed) return;

    setDeletingId(jobId);
    try {
      await deleteJobApi(jobId);
      toast.success('Job and applications deleted');
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  };

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);
  const activeJobsCount = jobs.filter((j) => j.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recruiter Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your job postings, candidate pipelines, and hiring workflows.
            </p>
          </div>

          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Jobs
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{jobs.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Openings
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{activeJobsCount}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Applicants
              </span>
              <div className="text-2xl font-extrabold text-slate-900">{totalApplicants}</div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="You haven't posted any jobs yet"
            description="Create your first job listing to begin accepting and tracking candidates through the hiring pipeline."
            action={
              <Link
                to="/jobs/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Create Your First Job
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isOpen = job.status === 'open';

              return (
                <div
                  key={job._id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isOpen ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {isOpen ? 'Open' : 'Closed'}
                      </span>

                      {job.jobType && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                          {job.jobType}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                      <Link to={`/jobs/${job._id}/pipeline`}>{job.title}</Link>
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        {job.applicantCount || 0} Candidate
                        {(job.applicantCount || 0) === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Pipeline Button */}
                    <Link
                      to={`/jobs/${job._id}/pipeline`}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      Pipeline Board ({job.applicantCount || 0})
                    </Link>

                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleStatus(job._id, job.status)}
                      disabled={togglingId === job._id}
                      title={`Click to mark as ${isOpen ? 'closed' : 'open'}`}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
                        isOpen
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {togglingId === job._id ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          {isOpen ? 'Close Job' : 'Reopen Job'}
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <Link
                      to={`/jobs/${job._id}/edit`}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Edit job details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteJob(job._id, job.title)}
                      disabled={deletingId === job._id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete job"
                    >
                      {deletingId === job._id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
