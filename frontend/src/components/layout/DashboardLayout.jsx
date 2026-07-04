import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-dark text-text-primary">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Core Container */}
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
        {/* Sidebar Nav */}
        <Sidebar />

        {/* Scrollable Work Panel */}
        <main className="flex-1 overflow-y-auto bg-bg-dark/20 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
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
