import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Calendar, ArrowUpRight } from 'lucide-react';

export const JobCard = ({ job }) => {
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

  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      to={`/jobs/${job._id}`}
      className="group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
    >
      <div>
        {/* Top Badges & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {job.jobType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 capitalize">
                {job.jobType}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
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
              {job.status === 'open' ? 'Active' : 'Closed'}
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
          {job.title}
        </h3>

        {/* Recruiter info if populated */}
        {job.recruiter?.name && (
          <p className="text-xs font-medium text-slate-500 mt-1 mb-3">
            Posted by <span className="text-slate-700 font-semibold">{job.recruiter.name}</span>
          </p>
        )}

        {/* Description snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-3 flex-wrap">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location}
            </span>
          )}
          {salaryString && (
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              {salaryString}
            </span>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
