import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyApplications from './pages/MyApplications';
import ApplicationDetail from './pages/ApplicationDetail';
import RecruiterDashboard from './pages/RecruiterDashboard';
import JobForm from './pages/JobForm';
import PipelineBoard from './pages/PipelineBoard';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/jobs" replace />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Candidate Routes */}
              <Route
                path="/my-applications"
                element={
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <MyApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-applications/:id"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'recruiter']}>
                    <ApplicationDetail />
                  </ProtectedRoute>
                }
              />

              {/* Recruiter Routes */}
              <Route
                path="/recruiter/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/new"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <JobForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <JobForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/pipeline"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <PipelineBoard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/jobs" replace />} />
            </Routes>
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
