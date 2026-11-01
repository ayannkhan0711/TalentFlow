import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { STAGE_CONFIG, isValidTransition } from '../utils/pipelineRules';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const KanbanColumn = ({
  stage,
  applications,
  activeApplication,
  onSelectCard,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      stage,
    },
  });

  const config = STAGE_CONFIG[stage] || {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    headerBg: 'bg-slate-100',
  };

  // Determine drop validity state
  const isDragging = Boolean(activeApplication);
  const isCurrentStage = activeApplication?.stage === stage;
  const isTargetValid = activeApplication
    ? isValidTransition(activeApplication.stage, stage)
    : false;

  let droppableStyles = 'border-slate-200/80 bg-slate-50/60';
  let bannerMessage = null;

  if (isDragging) {
    if (isCurrentStage) {
      droppableStyles = 'border-slate-300 bg-slate-50/80';
    } else if (isTargetValid) {
      if (isOver) {
        droppableStyles = 'border-emerald-500 bg-emerald-50/50 shadow-lg ring-2 ring-emerald-500/30';
      } else {
        droppableStyles = 'border-emerald-300 border-dashed bg-emerald-50/20';
      }
    } else {
      // Disallowed drop target
      droppableStyles =
        'border-rose-200 border-dashed bg-rose-50/20 opacity-50 cursor-not-allowed';
      if (isOver) {
        bannerMessage = 'Transition not allowed';
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-80 max-w-sm rounded-2xl border transition-all duration-200 flex-shrink-0 ${droppableStyles}`}
      data-stage={stage}
    >
      {/* Column Header */}
      <div className={`p-3.5 rounded-t-2xl border-b border-slate-200/60 flex items-center justify-between ${config.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className={`font-bold text-sm ${config.text}`}>{stage}</h3>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/80 shadow-xs border ${config.border} ${config.text}`}
        >
          {applications.length}
        </span>
      </div>

      {/* Disallowed Drop Warning Banner */}
      {bannerMessage && (
        <div className="bg-rose-500 text-white text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" />
          {bannerMessage}
        </div>
      )}

      {/* Column Cards Container */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[300px] kanban-scroll">
        <SortableContext
          items={applications.map((app) => app._id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <KanbanCard
              key={app._id}
              application={app}
              onSelectCard={onSelectCard}
            />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium select-none">
            No applicants in this stage
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
