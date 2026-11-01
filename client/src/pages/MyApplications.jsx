import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplicationsApi, withdrawApplicationApi } from '../api/applications';
import StageBadge from '../components/StageBadge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import {
  Briefcase,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getMyApplicationsApi();
      setApplications(res.data || []);
    } catch (err) {
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId, jobTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to withdraw your application for "${jobTitle}"? This will set your status to Rejected.`
    );
    if (!confirmed) return;

    setWithdrawingId(applicationId);
    try {
      const updated = await withdrawApplicationApi(applicationId);
      toast.success('Application withdrawn');
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, stage: 'Rejected' } : app))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Applications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track the status of your submitted job applications and timeline updates.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            title="You haven't applied to any jobs yet"
            description="Explore our curated job postings and submit your application to start your journey."
            action={
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Browse Open Roles <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const isTerminal = app.stage === 'Hired' || app.stage === 'Rejected';
              const appliedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StageBadge stage={app.stage} />
                      {app.job?.jobType && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                          {app.job.jobType}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                      <Link to={`/my-applications/${app._id}`}>
                        {app.job?.title || 'Untitled Position'}
                      </Link>
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      {app.job?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {app.job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Applied on {appliedDate}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Link
                      to={`/my-applications/${app._id}`}
                      className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      View Timeline
                    </Link>

                    <button
                      onClick={() => handleWithdraw(app._id, app.job?.title)}
                      disabled={isTerminal || withdrawingId === app._id}
                      title={
                        isTerminal
                          ? `Cannot withdraw an application in ${app.stage} stage`
                          : 'Withdraw this application'
                      }
                      className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1 border border-transparent hover:border-rose-200"
                    >
                      {withdrawingId === app._id ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Withdraw
                        </>
                      )}
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

export default MyApplications;
