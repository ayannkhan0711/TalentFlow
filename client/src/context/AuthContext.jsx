import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('talentflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('talentflow_token');
      if (storedToken) {
        try {
          const res = await getMeApi();
          setUser(res.user);
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('talentflow_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginApi({ email, password });
    localStorage.setItem('talentflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await registerApi(userData);
    localStorage.setItem('talentflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('talentflow_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isRecruiter: user?.role === 'recruiter',
    isCandidate: user?.role === 'candidate',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
