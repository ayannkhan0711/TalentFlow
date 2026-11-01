import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createJobApi, getJobByIdApi, updateJobApi } from '../api/jobs';
import Spinner from '../components/Spinner';
import { validateSalaryRange } from '../utils/validators';
import { ArrowLeft, Save, Briefcase, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    jobType: 'full-time',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchJob = async () => {
        try {
          const job = await getJobByIdApi(id);
          setFormData({
            title: job.title || '',
            description: job.description || '',
            location: job.location || '',
            jobType: job.jobType || 'full-time',
            salaryMin: job.salaryMin !== undefined && job.salaryMin !== null ? job.salaryMin : '',
            salaryMax: job.salaryMax !== undefined && job.salaryMax !== null ? job.salaryMax : '',
            currency: job.currency || 'USD',
          });
        } catch (err) {
          toast.error('Failed to load job details');
          navigate('/recruiter/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.title.trim()) {
      setValidationError('Job title is required');
      return;
    }

    if (!formData.description.trim()) {
      setValidationError('Job description is required');
      return;
    }

    // Validate salary range
    const salaryCheck = validateSalaryRange(formData.salaryMin, formData.salaryMax);
    if (!salaryCheck.valid) {
      setValidationError(salaryCheck.error);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin !== '' ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax !== '' ? Number(formData.salaryMax) : undefined,
      };

      if (isEditing) {
        await updateJobApi(id, payload);
        toast.success('Job posting updated successfully');
      } else {
        await createJobApi(payload);
        toast.success('New job posted successfully');
      }

      navigate('/recruiter/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
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
      <div className="max-w-3xl mx-auto">
        <Link
          to="/recruiter/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {isEditing ? 'Edit Job Posting' : 'Post a New Job'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the details below to attract top candidates.
              </p>
            </div>
          </div>

          {validationError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white capitalize font-medium"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Compensation Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Compensation Range (Annual / Hourly)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="number"
                    min="0"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    placeholder="Min Salary (e.g. 100000)"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    placeholder="Max Salary (e.g. 140000)"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ensure Maximum Salary is greater than or equal to Minimum Salary.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Job Description *
              </label>
              <textarea
                name="description"
                required
                rows={8}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe role responsibilities, team culture, required skills, and qualification expectations..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-y leading-relaxed"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/recruiter/dashboard"
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Save Changes' : 'Publish Job'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
