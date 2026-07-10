import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import escrowService from '../../services/escrow.service';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ArrowRight, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';

export const DisputeList = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';

  const { data: escrows = [], isLoading } = useQuery({
    queryKey: ['escrows', userEmail],
    queryFn: () => escrowService.getEscrowList(),
    enabled: !!userEmail,
  });
  const disputedEscrows = escrows.filter((e) => e.status === 'DISPUTED');

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2.5">
          <ShieldAlert className="h-8 w-8 text-[#EF4444]" />
          <span>Disputes & AI Arbitration</span>
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Monitor disputed escrows, inspect parallel advocate arguments, and trigger deterministic confidence checks.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8B5CF6] border-t-transparent"></div>
        </div>
      ) : disputedEscrows.length === 0 ? (
        <div className="glass-panel p-20 flex flex-col items-center justify-center text-center text-text-muted bg-white/40 shadow-xs border-white/60">
          <CheckCircleIcon className="h-16 w-16 text-[#10B981]/30 mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">Clear Ledger</h3>
          <p className="text-sm max-w-sm leading-relaxed">No escrow agreements are currently in the disputed state. Everything is running smoothly.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {disputedEscrows.map((escrow, i) => {
            const isUserBuyer = escrow.buyerName === currentUser?.name;
            return (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="glass-panel p-6 shadow-sm flex flex-col justify-between glass-panel-hover"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-[#EF4444]/15 text-[#DC2626] border border-[#EF4444]/20 uppercase tracking-wider">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>DISPUTED</span>
                    </span>

                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      ID: #{escrow.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary truncate mb-1">{escrow.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2 mb-5 h-8 font-medium">
                    {escrow.disputeReason || "Dispute claim submitted. Awaiting AI arbitration or manual intervention."}
                  </p>
                </div>

                <div className="border-t border-white/60 pt-4 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Net Locked Value</span>
                    <span className="text-lg font-black text-text-primary leading-tight">${Number(escrow.lockedAmount || escrow.amount).toFixed(2)}</span>
                  </div>

                  <Link
                    to={`/disputes/${escrow.id}`}
                    className="inline-flex items-center space-x-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 hover:border-[#EF4444]/60 px-4 py-2 text-xs font-bold text-[#DC2626] transition-all cursor-pointer shadow-2xs hover:bg-[#EF4444]/15"
                  >
                    <span>{isAdmin ? 'Arbitrate' : 'View Live Verdict'}</span>
                    <Gavel className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// SVG helper
const CheckCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default DisputeList;
