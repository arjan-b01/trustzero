import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import auditService from '../../services/audit.service';
import {
  Scroll,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Send,
  Loader,
  Hammer
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const EscrowDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  const queryClient = useQueryClient();

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerResolve, handleSubmit: handleSubmitResolve, reset: resetResolve } = useForm();

  // 1. Fetch Escrow Details
  const { data: escrow, isLoading, isError, refetch } = useQuery({
    queryKey: ['escrow', id, userEmail],
    queryFn: () => escrowService.getEscrowById(userEmail, id),
    enabled: !!id && !!userEmail
  });

  // 2. Fetch Escrow History Audit Logs
  const { data: auditLogs } = useQuery({
    queryKey: ['escrow-history', id],
    queryFn: () => auditService.getEscrowHistory(id),
    enabled: !!id
  });

  // 3. Fund Escrow Mutation
  const fundMutation = useMutation({
    mutationFn: () => escrowService.fundEscrow(userEmail, id),
    onSuccess: () => {
      toast.success('Escrow funded successfully! Funds are now locked.');
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      queryClient.invalidateQueries({ queryKey: ['escrow-history', id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Funding failed.');
    }
  });

  // 4. Release Funds Mutation
  const releaseMutation = useMutation({
    mutationFn: () => escrowService.releaseFunds(userEmail, id),
    onSuccess: () => {
      toast.success('Funds released to the seller!');
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      queryClient.invalidateQueries({ queryKey: ['escrow-history', id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Release failed.');
    }
  });

  // 5. Open Dispute Mutation
  const disputeMutation = useMutation({
    mutationFn: (data) => escrowService.openDispute(userEmail, id, data),
    onSuccess: () => {
      toast.success('Dispute filed successfully! Escrow locked in disputed status.');
      setShowDisputeModal(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      queryClient.invalidateQueries({ queryKey: ['escrow-history', id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to open dispute.');
    }
  });

  // 6. Manual Resolve Dispute Mutation (Admin only)
  const resolveMutation = useMutation({
    mutationFn: (data) => escrowService.resolveDispute(userEmail, id, data),
    onSuccess: () => {
      toast.success('Dispute resolved manually!');
      setShowResolveModal(false);
      resetResolve();
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      queryClient.invalidateQueries({ queryKey: ['escrow-history', id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !escrow) {
    return (
      <div className="text-center py-20 rounded-2xl glass-panel text-text-muted">
        <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Failed to load Escrow contract</h3>
        <p className="text-sm mt-1 mb-4">The agreement may not exist or you lack authorization to inspect it.</p>
        <Link to="/escrows" className="inline-flex items-center space-x-2 text-brand-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to list</span>
        </Link>
      </div>
    );
  }

  const isBuyer = escrow.buyerName === currentUser?.name;
  const isSeller = escrow.sellerName === currentUser?.name;
  const isAdmin = currentUser?.role === 'ADMIN';

  // State Timeline Logic helper
  const steps = ['CREATED', 'FUNDED', 'RELEASED'];
  if (escrow.status === 'DISPUTED' || escrow.status === 'REFUNDED') {
    steps[2] = escrow.status;
  }
  const currentStepIndex = steps.indexOf(escrow.status);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/escrows"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-dark border border-border-dark text-text-secondary hover:text-text-primary transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2">
              <Scroll className="h-6 w-6 text-brand-primary" />
              <span>{escrow.title}</span>
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Escrow ID: {escrow.id} • Created on {new Date(escrow.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Top Status Indicator */}
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold border ${
          escrow.status === 'RELEASED' ? 'bg-success/15 text-success border-success/30' :
          escrow.status === 'FUNDED' ? 'bg-brand-secondary/15 text-brand-secondary border-brand-secondary/30' :
          escrow.status === 'DISPUTED' ? 'bg-danger/15 text-danger border-danger/30' :
          escrow.status === 'REFUNDED' ? 'bg-warning/15 text-warning border-warning/30' :
          'bg-text-muted/15 text-text-muted border-border-dark'
        }`}>
          {escrow.status}
        </span>
      </div>

      {/* Progress Timeline Tracker */}
      <div className="rounded-2xl glass-panel p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-6">Contract Execution Progress</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
          {steps.map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex items-center space-x-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                  idx <= currentStepIndex
                    ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-sm shadow-brand-primary/10'
                    : 'border-border-dark text-text-muted bg-bg-dark/40'
                }`}>
                  {idx < currentStepIndex ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                </div>
                <div>
                  <p className={`text-sm font-bold ${idx <= currentStepIndex ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {step}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {idx === currentStepIndex ? 'Active Phase' : idx < currentStepIndex ? 'Completed' : 'Upcoming'}
                  </p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`hidden md:block h-[2px] flex-1 mx-4 transition-all ${
                  idx < currentStepIndex ? 'bg-brand-primary' : 'bg-border-dark'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (Contract Details & Actions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="rounded-2xl glass-panel p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-2">Description & Deliverables</h3>
              <p className="text-sm text-text-secondary leading-relaxed bg-bg-dark/40 rounded-xl p-4 border border-border-dark/50">
                {escrow.description}
              </p>
            </div>

            {/* Financial Details Row */}
            <div className="grid gap-4 sm:grid-cols-3 border-t border-border-dark pt-6">
              <div>
                <span className="text-xs text-text-secondary block">Total Contract Value</span>
                <span className="text-xl font-bold text-text-primary">${Number(escrow.amount).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary block">Commission Fee (3%)</span>
                <span className="text-xl font-bold text-warning">${Number(escrow.platformFee || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary block">Locked Net Guarantee</span>
                <span className="text-xl font-bold text-success">${Number(escrow.lockedAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid gap-4 sm:grid-cols-2 border-t border-border-dark pt-6 text-xs text-text-secondary">
              <div className="bg-card-dark/40 rounded-xl p-3 border border-border-dark/30">
                <span className="text-[10px] text-text-muted font-bold uppercase block">Buyer Participant</span>
                <span className="text-sm font-bold text-text-primary mt-1 block">{escrow.buyerName}</span>
                <span className="text-[10px] text-text-muted">Account ID: {escrow.buyerId}</span>
              </div>
              <div className="bg-card-dark/40 rounded-xl p-3 border border-border-dark/30">
                <span className="text-[10px] text-text-muted font-bold uppercase block">Seller Participant</span>
                <span className="text-sm font-bold text-text-primary mt-1 block">{escrow.sellerName}</span>
                <span className="text-[10px] text-text-muted">Account ID: {escrow.sellerId}</span>
              </div>
            </div>

            {/* Dispute Reason section if present */}
            {escrow.disputeReason && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 space-y-2">
                <span className="flex items-center text-xs font-bold text-danger">
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  Dispute Resolution Audit Record
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {escrow.disputeReason}
                </p>
              </div>
            )}
          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap gap-4">
            {/* BUYER funding CREATED contract */}
            {escrow.status === 'CREATED' && isBuyer && (
              <button
                onClick={() => fundMutation.mutate()}
                disabled={fundMutation.isPending}
                className="flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-5 py-3 text-sm font-bold text-text-primary shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                {fundMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                <span>Fund Escrow Agreement</span>
              </button>
            )}

            {/* Actions for FUNDED state */}
            {escrow.status === 'FUNDED' && (
              <>
                {isBuyer && (
                  <button
                    onClick={() => releaseMutation.mutate()}
                    disabled={releaseMutation.isPending}
                    className="flex items-center space-x-2 rounded-lg bg-success px-5 py-3 text-sm font-bold text-text-primary shadow-sm hover:bg-success-dark transition-all cursor-pointer"
                  >
                    {releaseMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>Release Funds to Seller</span>
                  </button>
                )}

                {(isBuyer || isSeller) && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="flex items-center space-x-2 rounded-lg bg-danger px-5 py-3 text-sm font-bold text-text-primary shadow-sm hover:bg-danger-dark transition-all cursor-pointer"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Raise Dispute</span>
                  </button>
                )}
              </>
            )}

            {/* Actions for DISPUTED state (Admin trigger AI or manual) */}
            {escrow.status === 'DISPUTED' && (
              <>
                {isAdmin && (
                  <Link
                    to={`/disputes/${escrow.id}`}
                    className="flex items-center space-x-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-bold text-text-primary shadow-sm hover:opacity-90 transition-all cursor-pointer"
                  >
                    <Hammer className="h-4 w-4" />
                    <span>Open AI Arbitration Hub</span>
                  </Link>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="flex items-center space-x-2 rounded-lg bg-card-dark border border-border-dark px-5 py-3 text-sm font-bold text-text-primary hover:border-brand-primary/50 transition-all cursor-pointer"
                  >
                    <span>Resolve Manually</span>
                  </button>
                )}

                {!isAdmin && (
                  <Link
                    to={`/disputes/${escrow.id}`}
                    className="flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-5 py-3 text-sm font-bold text-text-primary shadow-sm hover:opacity-90 transition-all cursor-pointer"
                  >
                    <span>View Live Arbitration Verdict</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column (Audit Timeline logs) */}
        <div className="rounded-2xl glass-panel p-6 flex flex-col justify-between h-fit">
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-brand-secondary" />
              <span>Contract History Timeline</span>
            </h3>

            {!auditLogs || auditLogs.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-xs">
                <p>No audit timeline logs registered for this escrow.</p>
              </div>
            ) : (
              <div className="relative border-l border-border-dark pl-5 space-y-6 text-xs text-text-secondary">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Circle marker */}
                    <span className="absolute -left-[25px] top-1.5 flex h-2 w-2 rounded-full bg-brand-primary"></span>
                    <p className="font-bold text-text-primary">{log.action}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <p className="mt-1 text-text-secondary">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISPUTE MODAL */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <span>File Structured Dispute Claim</span>
              </h3>
              <p className="text-xs text-text-secondary">
                Submit this dispute claim to freeze the contract. Our three-agent AI arbitration pipeline will automatically review statements and delivery logs.
              </p>

              <form onSubmit={handleSubmit(onSubmitDispute = (data) => disputeMutation.mutate(data))} className="space-y-4 text-sm text-text-secondary">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Buyer Claim / Issue Statement</label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 p-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                    placeholder="Describe exactly what went wrong or why you want a refund..."
                    {...register('buyerClaim', { required: true })}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Seller Response Statement (Optional)</label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 p-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                    placeholder="Enter seller's defense if already discussed..."
                    {...register('sellerResponse')}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Agreed Delivery Terms</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 p-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                    placeholder="e.g., Deliver website source files by July 15"
                    {...register('agreedDeliveryTerms', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Evidence URL / Delivery Proof</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 p-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                    placeholder="e.g., URL to github commit or hosted demo site"
                    {...register('evidenceUrl')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <label className="flex items-center space-x-2 bg-card-dark/40 border border-border-dark/50 rounded-lg p-2 cursor-pointer">
                    <input type="checkbox" {...register('deliveryProofSubmitted')} />
                    <span>Proof Submitted</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-card-dark/40 border border-border-dark/50 rounded-lg p-2 cursor-pointer">
                    <input type="checkbox" {...register('deadlineMet')} />
                    <span>Deadline Met</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="rounded-lg border border-border-dark px-4 py-2 text-xs font-semibold hover:bg-card-dark text-text-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeMutation.isPending}
                    className="flex items-center space-x-1.5 rounded-lg bg-danger px-4 py-2 text-xs font-bold text-text-primary hover:bg-danger-dark cursor-pointer disabled:opacity-50"
                  >
                    {disputeMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Submit Dispute</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESOLVE MANUAL MODAL */}
      <AnimatePresence>
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <Hammer className="h-5 w-5 text-brand-primary" />
                <span>Manual Admin Resolution Override</span>
              </h3>

              <form onSubmit={handleSubmitResolve(onSubmitResolve = (data) => resolveMutation.mutate(data))} className="space-y-4 text-sm text-text-secondary">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Resolution Outcome</label>
                  <select
                    className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 p-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden cursor-pointer"
                    {...registerResolve('resolution', { required: true })}
                  >
                    <option value="RELEASE_TO_SELLER">RELEASE_TO_SELLER (Release net amount to Seller)</option>
                    <option value="REFUND_TO_BUYER">REFUND_TO_BUYER (Refund net amount to Buyer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Admin Notes / Reasoning</label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 p-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                    placeholder="Document the human administrator audit notes here..."
                    {...registerResolve('adminNotes', { required: true })}
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="rounded-lg border border-border-dark px-4 py-2 text-xs font-semibold hover:bg-card-dark text-text-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolveMutation.isPending}
                    className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold text-text-primary hover:opacity-90 cursor-pointer disabled:opacity-50"
                  >
                    {resolveMutation.isPending ? 'Processing...' : 'Confirm Resolution'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Modals onSubmit bindings helpers
let onSubmitDispute;
let onSubmitResolve;

export default EscrowDetails;
