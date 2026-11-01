import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplicationActivityApi, getMyApplicationsApi, openAuthorizedFile } from '../api/applications';
import StageBadge from '../components/StageBadge';
import Spinner from '../components/Spinner';
import {
  ArrowLeft,
  Clock,
  FileText,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Briefcase,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ApplicationDetail = () => {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activityRes, appsRes] = await Promise.all([
          getApplicationActivityApi(id),
          getMyApplicationsApi(),
        ]);
        setLogs(activityRes.data || []);
        const matched = (appsRes.data || []).find((a) => a._id === id);
        setApplication(matched);
      } catch (err) {
        toast.error('Failed to load application timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleResumeClick = async () => {
    if (!application?.resumeUrl) return;
    try {
      await openAuthorizedFile(application.resumeUrl, 'my-resume.pdf');
    } catch (err) {
      toast.error('Could not open resume');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/my-applications"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Applications
        </Link>

        {/* Application Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StageBadge stage={application?.stage || 'Applied'} size="lg" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {application?.job?.title || 'Job Application'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Applied on{' '}
                {application?.createdAt &&
                  new Date(application.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </p>
            </div>

            {application?.resumeUrl && (
              <button
                onClick={handleResumeClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors self-start sm:self-center"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                Submitted Resume
              </button>
            )}
          </div>

          {application?.coverNote && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Your Cover Note
              </span>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed italic">
                "{application.coverNote}"
              </p>
            </div>
          )}
        </div>

        {/* Timeline Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Application Progress Timeline
          </h2>

          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No timeline entries yet.</p>
          ) : (
            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log, index) => {
                const logDate = new Date(log.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={log._id} className="relative">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-white bg-emerald-500 shadow-sm flex items-center justify-center" />

                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-bold text-sm text-slate-900">
                          {log.fromStage ? (
                            <span>
                              Moved from <span className="text-slate-500">{log.fromStage}</span>{' '}
                              to{' '}
                              <span className="text-emerald-700 font-extrabold">
                                {log.toStage}
                              </span>
                            </span>
                          ) : (
                            <span>
                              Application submitted into{' '}
                              <span className="text-emerald-700 font-extrabold">
                                {log.toStage}
                              </span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{logDate}</span>
                      </div>

                      {log.changedBy?.name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Updated by{' '}
                          <span className="font-semibold text-slate-700">
                            {log.changedBy.name}
                          </span>
                        </p>
                      )}

                      {log.note && (
                        <div className="mt-3 bg-white p-3 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{log.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
