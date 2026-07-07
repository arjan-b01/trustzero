import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FFFDFC] px-4 text-center overflow-hidden font-sans">
      {/* Background Organic Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[25%] h-80 w-80 rounded-full bg-[#8B5CF6]/15 blur-[85px] mix-blend-multiply opacity-65 animate-blob"></div>
        <div className="absolute bottom-[20%] right-[25%] h-96 w-96 rounded-full bg-[#FF7EB6]/15 blur-[95px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md space-y-6 glass-panel p-8 shadow-2xl bg-white/40 border-white/60"
      >
        <AlertCircle className="mx-auto h-16 w-16 text-[#EF4444] animate-pulse" />
        <h1 className="text-5xl font-black tracking-tight text-text-primary">404</h1>
        <h2 className="text-xl font-extrabold text-text-primary">Page Not Found</h2>
        <p className="text-sm text-text-secondary leading-relaxed font-semibold">
          The escrow link or audit page you are looking for might have been archived or deleted.
        </p>
        <Link
          to="/dashboard"
          className="btn-primary inline-flex items-center space-x-2 px-6 py-3 text-sm font-semibold shadow-md cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
