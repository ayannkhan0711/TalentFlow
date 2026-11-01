import React, { useState, useEffect } from 'react';
import { getJobsApi } from '../api/jobs';
import JobCard from '../components/JobCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { Search, MapPin, Briefcase, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
      };
      if (search.trim()) params.search = search.trim();
      if (location.trim()) params.location = location.trim();
      if (jobType) params.jobType = jobType;

      const res = await getJobsApi(params);
      setJobs(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, jobType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setJobType('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
            Find your next career leap
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Discover opportunities that match your passion
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Browse through verified positions from leading tech companies with real-time application tracking.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-4xl mx-auto bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-950/20 flex flex-col md:flex-row items-center gap-2 text-slate-800"
          >
            <div className="flex-1 w-full flex items-center px-3 py-2 border-b md:border-b-0 md:border-r border-slate-200">
              <Search className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job title, keywords, or skills..."
                className="w-full text-sm font-medium focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="w-full md:w-64 flex items-center px-3 py-2 border-b md:border-b-0 md:border-r border-slate-200">
              <MapPin className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or 'Remote'"
                className="w-full text-sm font-medium focus:outline-none placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-colors flex-shrink-0"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>

            {['', 'full-time', 'part-time', 'contract', 'internship', 'remote'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setJobType(type);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  jobType === type
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === '' ? 'All Types' : type}
              </button>
            ))}

            {(search || location || jobType) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-2"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="text-slate-900 font-bold">{jobs.length}</span> of{' '}
            <span className="text-slate-900 font-bold">{total}</span> positions
          </div>
        </div>

        {/* Job Listings Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No matching jobs found"
            description="Try modifying your search keywords or clearing your filters to see more results."
            action={
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Reset all filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm font-medium text-slate-600 px-3">
              Page <strong className="text-slate-900">{page}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
