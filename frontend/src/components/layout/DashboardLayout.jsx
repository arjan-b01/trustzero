import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tz_theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('tz_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg-dark text-text-primary">
      {/* Organic Background Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] h-80 w-80 rounded-full bg-[#8B5CF6]/15 blur-[90px] mix-blend-multiply opacity-65 animate-blob"></div>
        <div className="absolute top-[30%] right-[10%] h-96 w-96 rounded-full bg-[#FF7EB6]/15 blur-[100px] mix-blend-multiply opacity-65 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[15%] left-[20%] h-88 w-88 rounded-full bg-[#FFC371]/15 blur-[90px] mix-blend-multiply opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[25%] right-[20%] h-80 w-80 rounded-full bg-[#60A5FA]/15 blur-[85px] mix-blend-multiply opacity-65 animate-blob animation-delay-6000"></div>
      </div>

      {/* Top Navbar */}
      <div className="p-4 pb-0 z-20 shrink-0">
        <Navbar 
          isSidebarOpen={isSidebarOpen} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Main Core Container */}
      <div className="flex flex-1 overflow-hidden p-4 pt-2 gap-4 z-10">
        {/* Sidebar Nav */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-35 bg-black/35 backdrop-blur-xs"
              />
              <Sidebar onClose={() => setIsSidebarOpen(false)} theme={theme} onToggleTheme={toggleTheme} />
            </>
          )}
        </AnimatePresence>

        {/* Scrollable Work Panel */}
        <main className="flex-1 overflow-y-auto rounded-3xl glass-panel p-6 md:p-8 bg-white/20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
