import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-dark px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md space-y-6 rounded-2xl glass-panel p-8 shadow-2xl"
      >
        <AlertCircle className="mx-auto h-16 w-16 text-danger animate-pulse" />
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">404</h1>
        <h2 className="text-xl font-bold text-text-primary">Page Not Found</h2>
        <p className="text-sm text-text-secondary">
          The escrow link or audit page you are looking for might have been archived or deleted.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-5 py-2.5 text-sm font-semibold text-text-primary shadow-sm hover:opacity-90 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
