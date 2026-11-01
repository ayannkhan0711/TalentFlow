import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  Send,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import StageBadge from './StageBadge';
import Spinner from './Spinner';
import {
  getApplicationActivityApi,
  updateApplicationStageApi,
  openAuthorizedFile,
} from '../api/applications';
import { ALLOWED_TRANSITIONS } from '../utils/pipelineRules';
import toast from 'react-hot-toast';

export const CandidatePanel = ({
  application,
  onClose,
  onStageUpdated,
}) => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [submittingStage, setSubmittingStage] = useState(false);
  const [nextStage, setNextStage] = useState('');
  const [note, setNote] = useState('');

  const currentStage = application?.stage;
  const allowedNextStages = ALLOWED_TRANSITIONS[currentStage] || [];

  // Fetch activity log
  useEffect(() => {
    if (!application?._id) return;

    let isMounted = true;
    const fetchActivity = async () => {
      setLoadingActivity(true);
      try {
        const res = await getApplicationActivityApi(application._id);
        if (isMounted) {
          setActivityLogs(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching activity log:', err);
        if (isMounted) {
          toast.error('Could not load activity timeline');
        }
      } finally {
        if (isMounted) setLoadingActivity(false);
      }
    };

    fetchActivity();
    setNextStage('');
    setNote('');

    return () => {
      isMounted = false;
    };
  }, [application?._id]);

  if (!application) return null;

  const handleResumeClick = async () => {
    try {
      await openAuthorizedFile(
        application.resumeUrl,
        `${application.candidate?.name || 'Resume'}.pdf`
      );
    } catch (err) {
      toast.error(err.message || 'Could not download resume');
    }
  };

  const handleStageChangeSubmit = async (e) => {
    e.preventDefault();
    if (!nextStage) {
      toast.error('Please select a target stage');
      return;
    }

    setSubmittingStage(true);
    try {
      const updated = await updateApplicationStageApi(
        application._id,
        nextStage,
        note.trim() || undefined
      );
      toast.success(`Candidate moved to ${nextStage}`);
      onStageUpdated(updated);

      // Refresh activity log
      const res = await getApplicationActivityApi(application._id);
      setActivityLogs(res.data || []);
      setNextStage('');
      setNote('');
    } catch (err) {
      toast.error(err.message || 'Failed to update stage');
    } finally {
      setSubmittingStage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {application.candidate?.name || 'Candidate Details'}
                </h2>
                <StageBadge stage={application.stage} />
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {application.candidate?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleResumeClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Resume
              </button>
            </div>

            {/* Cover Note */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Cover Note
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed">
                {application.coverNote ? (
                  application.coverNote
                ) : (
                  <span className="text-slate-400 italic">No cover note provided.</span>
                )}
              </div>
            </div>

            {/* Advance Stage Form */}
            {allowedNextStages.length > 0 ? (
              <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Move to Next Stage
                </h3>
                <form onSubmit={handleStageChangeSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Stage
                    </label>
                    <select
                      value={nextStage}
                      onChange={(e) => setNextStage(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">Select next stage...</option>
                      {allowedNextStages.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Optional Note for Timeline
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Cleared technical interview"
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!nextStage || submittingStage}
                    className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingStage ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Apply Stage Change
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-100 p-3.5 rounded-xl text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                This application is in terminal stage ({currentStage}).
              </div>
            )}

            {/* Activity Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Activity Timeline
              </h3>

              {loadingActivity ? (
                <div className="py-6 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No activity recorded.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activityLogs.map((log) => {
                    const logDate = new Date(log.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    );

                    return (
                      <div key={log._id} className="relative">
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {log.fromStage ? (
                                <>
                                  {log.fromStage} &rarr;{' '}
                                  <span className="text-emerald-700 font-extrabold">
                                    {log.toStage}
                                  </span>
                                </>
                              ) : (
                                <span className="text-emerald-700 font-extrabold">
                                  {log.toStage}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {logDate}
                            </span>
                          </div>

                          {log.changedBy?.name && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              By <span className="font-semibold text-slate-700">{log.changedBy.name}</span>
                            </p>
                          )}

                          {log.note && (
                            <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded-md border border-slate-100 flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                              <span>{log.note}</span>
                            </p>
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
      </div>
    </div>
  );
};

export default CandidatePanel;
