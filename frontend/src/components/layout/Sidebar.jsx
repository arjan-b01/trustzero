import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Scroll,
  AlertOctagon,
  History,
  User,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Sidebar = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    ...(currentUser?.role === 'ADMIN' ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Escrows', path: '/escrows', icon: Scroll },
    { name: 'Disputes', path: '/disputes', icon: AlertOctagon },
    { name: 'Audit Logs', path: '/audit', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between rounded-3xl glass-panel bg-white/40 p-4 shadow-md shrink-0">
      {/* Sidebar Navigation Options */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
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
    </aside>
  );
};

export default Sidebar;
