import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const { currentUser } = useAuth();

  return (
    <header className="w-full flex items-center justify-between glass-panel px-6 py-3 bg-white/40 shadow-md">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white shadow-sm"
        >
          <Shield className="h-5.5 w-5.5" />
        </motion.div>
        <span className="text-xl font-bold tracking-tight text-text-primary">
          Trust<span className="text-gradient font-black">Zero</span>
        </span>
      </div>

      {/* Utilities & User Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Icon */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-xl p-2.5 text-text-secondary hover:bg-white/80 hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-white/40 shadow-xs"
        >
          <Moon className="h-5 w-5" />
        </motion.button>

        {/* Notifications Icon */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative rounded-xl p-2.5 text-text-secondary hover:bg-white/80 hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-white/40 shadow-xs"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF7EB6] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7EB6]"></span>
          </span>
        </motion.button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-text-muted/20"></div>

        {/* User Info Avatar */}
        <div className="flex items-center space-x-3 bg-white/30 border border-white/60 rounded-full px-3 py-1 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#7B61FF]/20 to-[#FF7EB6]/20 text-[#8B5CF6] font-bold border border-[#8B5CF6]/30">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:flex flex-col text-left pr-1">
            <span className="text-xs font-semibold text-text-primary">
              {currentUser?.name || 'User'}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#8B5CF6]">
              {currentUser?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
