import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Scroll,
  AlertOctagon,
  History,
  LogOut,
  Settings,
  Moon,
  Sun,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Sidebar = ({ onClose }) => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const menuItems = [
    ...(currentUser?.role === 'ADMIN' ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Escrows', path: '/escrows', icon: Scroll },
    { name: 'Disputes', path: '/disputes', icon: AlertOctagon },
    { name: 'Audit Logs', path: '/audit', icon: History },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    if (onClose) onClose();
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <motion.aside
      initial={{ x: '-110%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-110%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="fixed inset-y-4 left-4 z-40 flex w-72 flex-col justify-between rounded-3xl glass-panel bg-white/85 p-5 shadow-xl border border-white/80"
    >
      <div className="space-y-6">
        {/* Header inside Sidebar */}
        <div className="flex items-center justify-between border-b border-text-muted/15 pb-4">
          <span className="text-base font-bold text-text-primary tracking-wide">Navigation Menu</span>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:bg-white/85 hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-white/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation Options */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7B61FF]/10 to-[#FF7EB6]/10 text-[#8B5CF6] border-l-4 border-[#8B5CF6] shadow-xs'
                    : 'text-text-secondary hover:bg-white/60 hover:text-text-primary hover:translate-x-1'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Collapsible Settings Section */}
        <div className="border-t border-text-muted/10 pt-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-text-secondary hover:bg-white/60 hover:text-text-primary transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 shrink-0" />
              <span>Settings</span>
            </div>
            <motion.span
              animate={{ rotate: showSettings ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs"
            >
              ▶
            </motion.span>
          </button>

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pl-6 pr-2 py-2 space-y-3"
            >
              <div className="flex items-center justify-between rounded-xl bg-white/40 border border-white/50 p-2.5 shadow-2xs">
                <span className="text-xs text-text-secondary font-semibold">Dark Mode (Beta)</span>
                <button
                  onClick={() => {
                    setIsDark(!isDark);
                    toast.success('Dark mode is currently under development!');
                  }}
                  className="rounded-xl p-2 bg-white/60 hover:bg-white text-text-primary border border-white/80 transition-all cursor-pointer"
                >
                  {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-[#8B5CF6]" />}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Logout Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold text-danger hover:bg-danger/10 hover:text-danger hover:translate-x-1 transition-all cursor-pointer border border-transparent hover:border-danger/25"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        <span>Logout</span>
      </motion.button>
    </motion.aside>
  );
};

export default Sidebar;
