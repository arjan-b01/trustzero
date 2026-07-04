import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Moon, Sun, ChevronDown } from 'lucide-react';

export const Navbar = () => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border-dark bg-bg-dark/80 px-6 backdrop-blur-md">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary text-text-primary shadow-sm">
          <Shield className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-text-primary">
          Trust<span className="text-brand-secondary">Zero</span>
        </span>
      </div>

      {/* Utilities & User Actions */}
      <div className="flex items-center space-x-4">
        {/* Dark Mode Icon */}
        <button className="rounded-lg p-2 text-text-secondary hover:bg-card-dark hover:text-text-primary transition-all cursor-pointer">
          <Moon className="h-5 w-5" />
        </button>

        {/* Notifications Icon */}
        <button className="relative rounded-lg p-2 text-text-secondary hover:bg-card-dark hover:text-text-primary transition-all cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-secondary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-secondary"></span>
          </span>
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-border-dark"></div>

        {/* User Info Avatar */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary font-bold border border-brand-primary/30">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold text-text-primary">
              {currentUser?.name || 'User'}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-secondary">
              {currentUser?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
