import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  action = null,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}
    >
      <div className="w-14 h-14 mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
