import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, KeyRound, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleClearCache = () => {
    if (currentUser?.email) {
      localStorage.removeItem(`tz_escrows_${currentUser.email}`);
      toast.success('Escrow local storage cache cleared! Refreshed default seeds.');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
          User Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account profile, check role authorizations, and adjust security keys.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-panel p-8 shadow-xl space-y-8"
      >
        {/* User Card Header */}
        <div className="flex items-center space-x-4 pb-6 border-b border-border-dark">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary text-2xl font-bold border border-brand-primary/30">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{currentUser?.name}</h2>
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30 mt-1 uppercase">
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid gap-6 sm:grid-cols-2 text-sm text-text-secondary">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Full Name</span>
            <div className="flex items-center space-x-2 bg-bg-dark/40 border border-border-dark/50 rounded-lg p-3">
              <User className="h-4.5 w-4.5 text-text-muted" />
              <span className="font-semibold text-text-primary">{currentUser?.name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Email Address</span>
            <div className="flex items-center space-x-2 bg-bg-dark/40 border border-border-dark/50 rounded-lg p-3">
              <Mail className="h-4.5 w-4.5 text-text-muted" />
              <span className="font-semibold text-text-primary truncate max-w-[200px]">{currentUser?.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Account Role</span>
            <div className="flex items-center space-x-2 bg-bg-dark/40 border border-border-dark/50 rounded-lg p-3">
              <Shield className="h-4.5 w-4.5 text-text-muted" />
              <span className="font-semibold text-text-primary">{currentUser?.role}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Unique User ID</span>
            <div className="flex items-center space-x-2 bg-bg-dark/40 border border-border-dark/50 rounded-lg p-3">
              <KeyRound className="h-4.5 w-4.5 text-text-muted" />
              <span className="font-semibold text-text-primary">#{currentUser?.userId}</span>
            </div>
          </div>
        </div>

        {/* Security & Actions divider */}
        <div className="border-t border-border-dark pt-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Security and Troubleshooting</h3>
          
          <div className="flex flex-wrap gap-4">
            {/* Clear Storage */}
            <button
              onClick={handleClearCache}
              className="flex items-center space-x-2 rounded-lg border border-border-dark hover:border-danger hover:text-danger px-4 py-2.5 text-xs font-bold text-text-secondary transition-all cursor-pointer bg-bg-dark/20"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset Local Cache</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout Session</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
