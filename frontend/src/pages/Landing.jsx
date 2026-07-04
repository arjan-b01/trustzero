import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Cpu, Lock, ArrowRight, Gavel, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary overflow-x-hidden flex flex-col justify-between">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 -ml-20 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 -mr-20 h-96 w-96 rounded-full bg-brand-secondary/10 blur-3xl"></div>

      {/* Header Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-brand-primary to-brand-secondary text-text-primary shadow-lg shadow-brand-primary/20">
            <Shield className="h-5.5 w-5.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">
            Trust<span className="text-brand-secondary font-black">Zero</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-all">
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-4 py-2 text-xs font-bold text-text-primary shadow-sm hover:opacity-90 transition-all"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col justify-center py-20 z-10">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 px-3.5 py-1 text-xs font-bold text-brand-primary">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Next-Gen AI-Powered Escrow</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-text-primary leading-tight">
              Zero-Trust Transactions. <br />
              <span className="text-gradient">AI-Arbitrated Escrow.</span>
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
              TrustZero combines traditional double-sided financial lockup with an explainable, multi-agent AI arbitration pipeline. Safeguard your contracting budgets automatically, and resolve disputes deterministically.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/register"
                className="flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-6 py-3 text-sm font-bold text-text-primary shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-all cursor-pointer"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-card-dark border border-border-dark px-6 py-3 text-sm font-semibold text-text-primary hover:border-brand-primary/50 transition-all cursor-pointer"
              >
                Access Account
              </Link>
            </div>
          </motion.div>

          {/* Graphical Pipeline Mockup (Right) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl glass-panel p-8 shadow-2xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-brand-accent/10 blur-xl"></div>
            
            <h3 className="text-sm font-bold text-text-primary flex items-center space-x-1.5 pb-3 border-b border-border-dark">
              <Cpu className="h-4.5 w-4.5 text-brand-secondary" />
              <span>Explainable AI Arbitration Pipeline</span>
            </h3>

            {/* flowchart step */}
            <div className="space-y-4 text-xs text-text-secondary">
              <div className="flex items-center justify-between bg-bg-dark/50 border border-border-dark/60 rounded-lg p-3">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-brand-primary mr-2"></span>
                  Buyer Advocate Agent
                </span>
                <span className="text-[10px] text-text-muted font-mono">Argues Refund</span>
              </div>
              <div className="flex items-center justify-between bg-bg-dark/50 border border-border-dark/60 rounded-lg p-3">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-brand-accent mr-2"></span>
                  Seller Advocate Agent
                </span>
                <span className="text-[10px] text-text-muted font-mono">Argues Release</span>
              </div>
              <div className="flex items-center justify-between bg-bg-dark/50 border border-border-dark/60 rounded-lg p-3">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-brand-secondary mr-2"></span>
                  Neutral Arbitrator Agent
                </span>
                <span className="text-[10px] text-text-muted font-mono">Verdicts: RELEASE | REFUND</span>
              </div>
            </div>

            <div className="rounded-xl bg-success/5 border border-success/20 p-4 text-[11px] text-success leading-relaxed flex items-start space-x-2">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                <strong>Spring State Machine & Acid Transactions:</strong> Auto-executes payouts or overrides instantly if AI confidence rating surpasses the 75% threshold.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-border-dark/50 flex items-center justify-center text-xs text-text-muted z-10">
        <p>© {new Date().getFullYear()} TrustZero Inc. All rights reserved. Secured under ACID guarantees.</p>
      </footer>
    </div>
  );
};

// SVG helper
const ShieldCheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default Landing;
