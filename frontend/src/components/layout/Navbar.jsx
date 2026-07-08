import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, User, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Navbar = ({ onMenuClick, theme, onToggleTheme }) => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const getNotifications = (role) => {
    if (role === 'ADMIN') {
      return [
        { id: 1, text: 'Dispute opened on Escrow #103', time: '2 hours ago', read: false },
        { id: 2, text: 'AI Arbitration verdict ready for Escrow #103', time: '1 hour ago', read: false },
        { id: 3, text: 'Audit logs updated for Wallet withdrawal', time: '1 day ago', read: true },
      ];
    } else if (role === 'SELLER') {
      return [
        { id: 1, text: 'Payment released for Freelance Website', time: '3 days ago', read: true },
        { id: 2, text: 'Dispute filed by Buyer on Database Audit', time: '2 days ago', read: false },
        { id: 3, text: 'New escrow terms submitted by Buyer', time: '5 mins ago', read: false },
      ];
    } else { // BUYER or guest
      return [
        { id: 1, text: 'Escrow #102 funded successfully', time: '4 hours ago', read: false },
        { id: 2, text: 'AI Arbitration verdict ready for Escrow #103', time: '1 hour ago', read: false },
        { id: 3, text: 'Dispute filed on Escrow #103', time: '2 days ago', read: true },
      ];
    }
  };

  useEffect(() => {
    if (currentUser?.role) {
      setNotifications(getNotifications(currentUser.role));
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setIsProfileOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="w-full flex items-center justify-between glass-panel px-6 py-3 bg-white/40 shadow-md relative">
      {/* Click outside overlays */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
      )}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)} />
      )}

      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3.5">
        {/* Hamburger/Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenuClick}
          className="rounded-xl p-2 text-text-secondary hover:bg-white/80 hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-white/40 shadow-xs"
        >
          <Menu className="h-5.5 w-5.5" />
        </motion.button>

        <Link to="/escrows" className="flex items-center space-x-3 hover:opacity-90 transition-opacity select-none">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white shadow-sm"
          >
            <Shield className="h-5.5 w-5.5" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-text-primary">
            Trust<span className="text-gradient font-black">Zero</span>
          </span>
        </Link>
      </div>

      {/* Utilities & User Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleTheme}
          className="rounded-xl p-2.5 text-text-secondary hover:bg-white/80 dark:hover:bg-white/10 hover:text-text-primary dark:hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/40 shadow-xs"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-[#8B5CF6]" />}
        </motion.button>

        {/* Notifications Icon Button */}
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-xl p-2.5 text-text-secondary hover:bg-white/80 hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-white/40 shadow-xs"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF7EB6] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7EB6]"></span>
              </span>
            )}
          </motion.button>

          {/* Notifications Dropdown Panel (Solid non-glass) */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#13111C] border border-gray-200 dark:border-white/10 p-4 shadow-xl z-40 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-text-muted/10 pb-2 text-xs">
                  <span className="font-bold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(notifications.map((n) => ({ ...n, read: true })));
                        toast.success('All notifications marked as read');
                      }}
                      className="text-[10px] text-[#8B5CF6] hover:underline font-bold cursor-pointer bg-transparent border-none"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-text-secondary text-xs py-4">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotifications(
                            notifications.map((item) =>
                              item.id === n.id ? { ...item, read: true } : item
                            )
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                          n.read
                            ? 'border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-white/2 text-text-secondary'
                            : 'border-[#8B5CF6]/20 bg-[#8B5CF6]/5 text-text-primary font-medium'
                        }`}
                      >
                        <p>{n.text}</p>
                        <span className="text-[9px] text-text-muted block mt-1 font-semibold">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-text-muted/20"></div>

        {/* User Info Avatar / Dropdown */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 bg-white/30 border border-white/60 rounded-full px-3 py-1 shadow-xs cursor-pointer hover:bg-white/50 transition-all select-none"
          >
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
          </motion.div>

          {/* Profile Dropdown Menu (Solid non-glass) */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#13111C] border border-gray-200 dark:border-white/10 p-2 shadow-xl z-40"
              >
                <div className="px-3.5 py-2.5 border-b border-text-muted/10 text-xs">
                  <p className="font-semibold text-text-primary">{currentUser?.name || 'User'}</p>
                  <p className="text-[10px] text-text-secondary font-medium">{currentUser?.email || ''}</p>
                </div>
                <div className="py-1 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-gradient-to-r hover:from-[#7B61FF]/10 hover:to-[#FF7EB6]/10 hover:text-[#8B5CF6] transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span>View Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 hover:text-danger transition-all cursor-pointer text-left bg-transparent border-none"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
