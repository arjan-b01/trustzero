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
      localStorage.removeItem('tz_global_escrows');
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
        <p className="mt-1.5 text-sm text-text-secondary">
          Manage your account profile, check role authorizations, and adjust security keys.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-8 shadow-xl space-y-8 bg-white/40 border-white/60"
      >
        {/* User Card Header */}
        <div className="flex items-center space-x-4 pb-6 border-b border-white/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#7B61FF]/20 to-[#FF7EB6]/20 text-[#8B5CF6] text-2xl font-bold border border-[#8B5CF6]/30 shadow-sm">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{currentUser?.name}</h2>
            <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-[#FF7EB6]/10 text-[#FF7EB6] border border-[#FF7EB6]/20 mt-1.5 uppercase tracking-wider">
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid gap-6 sm:grid-cols-2 text-sm text-text-secondary">
          <div className="space-y-1">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Full Name</span>
            <div className="flex items-center space-x-2.5 bg-white/30 border border-white/50 rounded-2xl p-4.5 shadow-2xs">
              <User className="h-4.5 w-4.5 text-text-muted shrink-0" />
              <span className="font-semibold text-text-primary">{currentUser?.name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Email Address</span>
            <div className="flex items-center space-x-2.5 bg-white/30 border border-white/50 rounded-2xl p-4.5 shadow-2xs">
              <Mail className="h-4.5 w-4.5 text-text-muted shrink-0" />
              <span className="font-semibold text-text-primary truncate" title={currentUser?.email}>{currentUser?.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Account Role</span>
            <div className="flex items-center space-x-2.5 bg-white/30 border border-white/50 rounded-2xl p-4.5 shadow-2xs">
              <Shield className="h-4.5 w-4.5 text-text-muted shrink-0" />
              <span className="font-semibold text-text-primary">{currentUser?.role}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Unique User ID</span>
            <div className="flex items-center space-x-2.5 bg-white/30 border border-white/50 rounded-2xl p-4.5 shadow-2xs">
              <KeyRound className="h-4.5 w-4.5 text-text-muted shrink-0" />
              <span className="font-semibold text-text-primary">#{currentUser?.userId}</span>
            </div>
          </div>
        </div>

        {/* Security & Actions divider */}
        <div className="border-t border-white/60 pt-8 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Security and Troubleshooting</h3>
          
          <div className="flex flex-wrap gap-4">
            {/* Clear Storage */}
            <button
              onClick={handleClearCache}
              className="btn-secondary flex items-center space-x-2 px-5 py-3 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset Local Cache</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 text-[#DC2626] px-5 py-3 text-xs font-bold transition-all duration-300 cursor-pointer shadow-2xs"
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
