import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { Layers, Mail, Lock, User, Briefcase, UserCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await register({ name, email, password, role });
      toast.success(`Account created! Welcome, ${user.name}`);
      navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/jobs');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create your account
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose your role and join TalentFlow today
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    role === 'candidate'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-emerald-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <UserCheck className={`w-5 h-5 mb-1.5 ${role === 'candidate' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div className="font-bold text-sm">Job Seeker</div>
                  <div className="text-[11px] text-slate-500">Apply & track jobs</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    role === 'recruiter'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-emerald-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mb-1.5 ${role === 'recruiter' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div className="font-bold text-sm">Recruiter</div>
                  <div className="text-[11px] text-slate-500">Post & manage hires</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
