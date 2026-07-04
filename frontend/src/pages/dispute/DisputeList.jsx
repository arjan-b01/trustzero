import React from 'react';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ArrowRight, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';

export const DisputeList = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';

  const escrows = escrowService.getEscrowList(userEmail);
  const disputedEscrows = escrows.filter((e) => e.status === 'DISPUTED');

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2">
          <ShieldAlert className="h-8 w-8 text-danger" />
          <span>Disputes & AI Arbitration</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor disputed escrows, inspect parallel advocate arguments, and trigger deterministic confidence checks.
        </p>
      </div>

      {disputedEscrows.length === 0 ? (
        <div className="rounded-2xl glass-panel p-16 flex flex-col items-center justify-center text-center text-text-muted">
          <CheckCircleIcon className="h-16 w-16 text-success/30 mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">Clear Ledger</h3>
          <p className="text-sm max-w-sm">No escrow agreements are currently in the disputed state. Everything is running smoothly.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {disputedEscrows.map((escrow, i) => {
            const isUserBuyer = escrow.buyerName === currentUser?.name;
            return (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl glass-panel p-6 shadow-sm flex flex-col justify-between glass-panel-hover"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs font-bold bg-danger/15 text-danger border border-danger/20">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>DISPUTED</span>
                    </span>

                    <span className="text-[10px] text-text-muted font-semibold">
                      ID: {escrow.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-text-primary truncate mb-1">{escrow.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2 mb-4 h-8">
                    {escrow.disputeReason || "Dispute claim submitted. Awaiting AI arbitration or manual intervention."}
                  </p>
                </div>

                <div className="border-t border-border-dark pt-4 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">Net Locked Value</span>
                    <span className="text-lg font-extrabold text-text-primary">${Number(escrow.lockedAmount || escrow.amount).toFixed(2)}</span>
                  </div>

                  <Link
                    to={`/disputes/${escrow.id}`}
                    className="flex items-center space-x-1.5 rounded-lg bg-danger/10 border border-danger/30 hover:border-danger/60 px-4 py-2 text-xs font-bold text-danger transition-all cursor-pointer"
                  >
                    <span>{isAdmin ? 'Arbitrate' : 'View Live Verdict'}</span>
                    <Gavel className="h-4 w-4" />
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
