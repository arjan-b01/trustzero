import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Cpu, Lock, ArrowRight, Gavel, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing = () => {
  return (
    <div className="relative min-h-screen bg-[#FFFDFC] text-text-primary overflow-x-hidden flex flex-col justify-between font-sans">
      {/* Background Organic Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[10%] h-[400px] w-[400px] rounded-full bg-[#8B5CF6]/15 blur-[100px] mix-blend-multiply opacity-60 animate-blob"></div>
        <div className="absolute top-[25%] right-[15%] h-[450px] w-[450px] rounded-full bg-[#FF7EB6]/15 blur-[110px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[10%] left-[25%] h-[420px] w-[420px] rounded-full bg-[#FFC371]/15 blur-[100px] mix-blend-multiply opacity-55 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[20%] right-[5%] h-[380px] w-[380px] rounded-full bg-[#6EA8FE]/20 blur-[90px] mix-blend-multiply opacity-60 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating Header Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 pt-6 z-20">
        <div className="glass-panel px-6 py-4 flex items-center justify-between bg-white/40 shadow-sm">
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white shadow-md shadow-[#7B61FF]/20"
            >
              <Shield className="h-5.5 w-5.5" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-text-primary">
              Trust<span className="text-gradient font-black">Zero</span>
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-all">
              Login
            </Link>
            <Link
              to="/register"
              className="btn-primary px-5 py-2.5 text-xs font-bold shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col justify-center py-16 md:py-24 z-10">
        <div className="grid gap-16 lg:grid-cols-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 lg:col-span-7"
          >
            <div className="inline-flex items-center space-x-2 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-4.5 py-1.5 text-xs font-bold text-[#8B5CF6] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#FF7EB6]" />
              <span>Next-Gen AI-Powered Escrow</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-extrabold tracking-tight text-text-primary leading-[1.1]">
              Zero-Trust Transactions. <br />
              <span className="text-gradient">AI-Arbitrated Escrow.</span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl font-normal">
              TrustZero combines traditional double-sided financial lockup with an explainable, multi-agent AI arbitration pipeline. Safeguard your contracting budgets automatically, and resolve disputes deterministically.
            </p>

            <div className="flex flex-wrap gap-5 pt-2">
              <Link
                to="/register"
                className="btn-primary flex items-center space-x-2 px-8 py-4 text-sm font-semibold cursor-pointer"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary px-8 py-4 text-sm font-semibold cursor-pointer"
              >
                Access Account
              </Link>
            </div>
          </motion.div>

          {/* Graphical Pipeline Mockup (Right) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="glass-panel p-8 shadow-2xl relative overflow-hidden bg-white/50 border-white/80 transition-all hover:translate-y-[-6px] hover:shadow-3xl hover:border-white">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-[#FF7EB6]/15 blur-xl"></div>
              
              <h3 className="text-sm font-bold text-text-primary flex items-center space-x-2 pb-4 border-b border-text-muted/10">
                <Cpu className="h-4.5 w-4.5 text-[#8B5CF6]" />
                <span>Explainable AI Arbitration Pipeline</span>
              </h3>

              {/* flowchart steps */}
              <div className="space-y-4 my-6 text-xs text-text-secondary">
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between bg-white/40 border border-white/60 rounded-xl p-3.5 shadow-xs"
                >
                  <span className="flex items-center font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#7B61FF] mr-2"></span>
                    Buyer Advocate Agent
                  </span>
                  <span className="text-[10px] text-text-muted font-semibold bg-[#7B61FF]/10 text-[#7B61FF] px-2 py-0.5 rounded-full">Argues Refund</span>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between bg-white/40 border border-white/60 rounded-xl p-3.5 shadow-xs"
                >
                  <span className="flex items-center font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#FF7EB6] mr-2"></span>
                    Seller Advocate Agent
                  </span>
                  <span className="text-[10px] text-text-muted font-semibold bg-[#FF7EB6]/10 text-[#FF7EB6] px-2 py-0.5 rounded-full">Argues Release</span>
                </motion.div>

                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between bg-white/40 border border-white/60 rounded-xl p-3.5 shadow-xs"
                >
                  <span className="flex items-center font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#FFC371] mr-2"></span>
                    Neutral Arbitrator Agent
                  </span>
                  <span className="text-[10px] text-text-muted font-semibold bg-[#FFC371]/15 text-[#D97706] px-2 py-0.5 rounded-full">Verdicts & Verdicts</span>
                </motion.div>
              </div>

              <div className="rounded-2xl bg-[#10B981]/5 border border-[#10B981]/20 p-4.5 text-xs text-[#065F46] leading-relaxed flex items-start space-x-3 shadow-2xs">
                <ShieldCheckIcon className="h-5.5 w-5.5 shrink-0 mt-0.5 text-[#10B981]" />
                <p className="font-medium">
                  <strong>Spring State Machine & Acid Transactions:</strong> Auto-executes payouts or overrides instantly if AI confidence rating surpasses the 75% threshold.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-text-muted/10 flex items-center justify-center text-xs text-text-muted z-10 px-6">
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
