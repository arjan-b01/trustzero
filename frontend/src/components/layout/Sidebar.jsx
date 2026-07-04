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

export const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col justify-between border-r border-border-dark bg-bg-dark/50 p-4">
      {/* Sidebar Navigation Options */}
      <nav className="space-y-1.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary'
                  : 'text-text-secondary hover:bg-card-dark hover:text-text-primary'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Action Button */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 hover:text-danger-light transition-all cursor-pointer"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
