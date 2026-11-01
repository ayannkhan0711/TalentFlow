import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { getJobByIdApi } from '../api/jobs';
import {
  getJobApplicationsApi,
  updateApplicationStageApi,
} from '../api/applications';
import KanbanColumn from '../components/KanbanColumn';
import KanbanCard from '../components/KanbanCard';
import CandidatePanel from '../components/CandidatePanel';
import Spinner from '../components/Spinner';
import { STAGES, isValidTransition } from '../utils/pipelineRules';
import { ArrowLeft, Users, RefreshCw, Briefcase, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const PipelineBoard = () => {
  const { id: jobId } = useParams();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active item for DndKit overlay & validation
  const [activeApplication, setActiveApplication] = useState(null);

  // Candidate detail side panel
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to trigger drag (avoids capturing simple clicks)
      },
    })
  );

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [jobRes, appsRes] = await Promise.all([
        getJobByIdApi(jobId),
        getJobApplicationsApi(jobId),
      ]);
      setJob(jobRes);
      setApplications(appsRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load pipeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  // Group applications by stage
  const applicationsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = applications.filter((app) => app.stage === stage);
    return acc;
  }, {});

  const handleDragStart = (event) => {
    const { active } = event;
    const app = applications.find((a) => a._id === active.id);
    setActiveApplication(app || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveApplication(null);

    if (!over) return;

    const draggedApp = applications.find((a) => a._id === active.id);
    if (!draggedApp) return;

    // Find target stage: `over.id` could be the column ID (stage name) or another card ID
    let targetStage = null;
    if (STAGES.includes(over.id)) {
      targetStage = over.id;
    } else {
      const overApp = applications.find((a) => a._id === over.id);
      if (overApp) {
        targetStage = overApp.stage;
      }
    }

    if (!targetStage || targetStage === draggedApp.stage) {
      return;
    }

    // Validate drop target according to pipeline transition rules
    if (!isValidTransition(draggedApp.stage, targetStage)) {
      toast.error(
        `Cannot move from "${draggedApp.stage}" to "${targetStage}". Illegal transition.`
      );
      return;
    }

    // Optimistic update
    const previousStage = draggedApp.stage;
    const previousApplications = [...applications];

    setApplications((prev) =>
      prev.map((app) =>
        app._id === draggedApp._id ? { ...app, stage: targetStage } : app
      )
    );

    // Call API to persist stage update
    try {
      const updated = await updateApplicationStageApi(draggedApp._id, targetStage);
      toast.success(
        `${draggedApp.candidate?.name || 'Candidate'} moved to ${targetStage}`
      );
      // Keep selected application up to date if open in drawer
      if (selectedApplication?._id === draggedApp._id) {
        setSelectedApplication(updated);
      }
    } catch (err) {
      // Revert optimistic update on server error
      toast.error(err.message || 'Stage transition failed. Reverting change.');
      setApplications(previousApplications);
    }
  };

  const handleStageUpdatedFromPanel = (updatedApp) => {
    setApplications((prev) =>
      prev.map((app) => (app._id === updatedApp._id ? updatedApp : app))
    );
    setSelectedApplication(updatedApp);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12 flex flex-col">
      {/* Board Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link
                to="/recruiter/dashboard"
                className="hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span>Hiring Pipeline</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {job?.title}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  job?.status === 'open'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {job?.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{applications.length} Total Applicants</span>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              title="Refresh applicants"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board Container (Horizontally Scrollable) */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto kanban-scroll">
        <div className="inline-flex gap-5 items-start min-h-[600px] pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                applications={applicationsByStage[stage] || []}
                activeApplication={activeApplication}
                onSelectCard={setSelectedApplication}
              />
            ))}

            <DragOverlay dropAnimation={null}>
              {activeApplication ? (
                <div className="rotate-2 scale-105 shadow-2xl">
                  <KanbanCard
                    application={activeApplication}
                    onSelectCard={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Candidate Details Side Drawer Panel */}
      {selectedApplication && (
        <CandidatePanel
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStageUpdated={handleStageUpdatedFromPanel}
        />
      )}
    </div>
  );
};

export default PipelineBoard;
