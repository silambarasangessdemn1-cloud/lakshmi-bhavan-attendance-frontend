import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await login(username.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Invalid username or password.');
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setIsLoading(true);
    setErrorMessage('');
    const res = await login(u, p);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Decorative ambient lights */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-emerald-600/10 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 py-8">
        {/* Branding Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/25 mb-4 border border-emerald-300/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Shree Lakshmi Bhavan
          </h1>
          <p className="mt-2 text-sm text-emerald-200/80 font-medium tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Multi-Branch Staff & Payroll Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Sign In to Workspace</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to manage branches, staff, attendance & salary.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <span className="font-semibold text-rose-400">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin or branchadmin"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          {/* <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Master Admin Access
            </p>
            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin', 'admin123')}
              disabled={isLoading}
              className="w-full p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500/60 text-left transition-all group cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                    Sign In as Super Admin
                  </div>
                  <div className="text-[11px] text-slate-400">
                    superadmin <span className="text-slate-600">•</span> admin123
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                1-Click
              </span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
              Branch Admins are created by the Super Admin inside the workspace.
            </p>
          </div> */}
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </div>
            Full control across all branches, add new branches &amp; create branch manager logins.
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Branch Admin</span>
            </div>
            Created by Super Admin. Logs in to manage their specific branch's staff &amp; payroll.
          </div>
        </div>
      </div>
    </div>
  );
};
