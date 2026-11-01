import React from 'react';
import { STAGE_CONFIG } from '../utils/pipelineRules';

export const StageBadge = ({ stage, size = 'md', className = '' }) => {
  const config = STAGE_CONFIG[stage] || {
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {stage}
    </span>
  );
};

export default StageBadge;
