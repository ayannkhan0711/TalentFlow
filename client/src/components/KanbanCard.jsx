import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Calendar, GripVertical, ChevronRight, User } from 'lucide-react';
import { openAuthorizedFile } from '../api/applications';
import toast from 'react-hot-toast';

export const KanbanCard = ({ application, onSelectCard }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application._id,
    data: {
      application,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const handleResumeClick = async (e) => {
    e.stopPropagation();
    try {
      await openAuthorizedFile(application.resumeUrl, `${application.candidate?.name || 'Resume'}.pdf`);
    } catch (err) {
      toast.error(err.message || 'Could not open resume');
    }
  };

  const appliedDate = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectCard(application)}
      className="group relative bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 -ml-1 text-slate-300 hover:text-slate-600 rounded cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors"
            title="Drag to change stage"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              {application.candidate?.name || 'Candidate'}
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {application.candidate?.email}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectCard(application);
          }}
          className="text-slate-300 group-hover:text-slate-500 p-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {application.coverNote && (
        <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100">
          "{application.coverNote}"
        </p>
      )}

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {appliedDate}
        </span>

        <button
          onClick={handleResumeClick}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md"
        >
          <FileText className="w-3 h-3" />
          Resume
        </button>
      </div>
    </div>
  );
};

export default KanbanCard;
