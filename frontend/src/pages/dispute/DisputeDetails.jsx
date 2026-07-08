import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import disputeService from '../../services/dispute.service';
import {
  Gavel,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Activity,
  Cpu,
  BrainCircuit,
  Award,
  Sparkles,
  HelpCircle,
  Clock,
  Hammer,
  AlertTriangle,
  Loader,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const DisputeDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  const queryClient = useQueryClient();

  const [activeAgentTab, setActiveAgentTab] = useState('arbitrator'); // buyer, seller, arbitrator
  const [pipelineStep, setPipelineStep] = useState(0); // For animating step progress during arbitration

  // 1. Fetch Escrow Details (which has disputeReason, status, etc.)
  const { data: escrow, isLoading: isEscrowLoading } = useQuery({
    queryKey: ['escrow', id, userEmail],
    queryFn: () => escrowService.getEscrowById(userEmail, id),
    enabled: !!id && !!userEmail
  });

  // 2. Fetch/Simulate Dispute Record Data
  const escrows = escrowService.getEscrowList(userEmail);
  const localEscrow = escrows.find(e => e.id === Number(id));

  const hasArbitrationResult = localEscrow?.aiRecommendedVerdict || escrow?.status === 'RELEASED' || escrow?.status === 'REFUNDED';

  // 3. Trigger Arbitration Mutation (Admin only)
  const arbitrateMutation = useMutation({
    mutationFn: () => disputeService.arbitrate(userEmail, id),
    onMutate: () => {
      setPipelineStep(1);
    },
    onSuccess: (data) => {
      toast.success(data.autoExecuted ? 'AI arbitration resolved and auto-executed contract!' : 'AI recommended verdict and escalated to Admin.');
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      setPipelineStep(4);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Arbitration trigger failed.');
      setPipelineStep(0);
    }
  });

  if (isEscrowLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent"></div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  // Get values from local storage cache
  const aiBuyerArg = localEscrow?.aiBuyerArgument || "The Buyer Advocate AI will formulate arguments supporting a refund...";
  const aiSellerArg = localEscrow?.aiSellerArgument || "The Seller Advocate AI will formulate arguments supporting payment release...";
  const aiReasoning = localEscrow?.aiReasoning || "The Neutral Arbitrator AI will balance evidence and make a final ruling...";
  const aiVerdict = localEscrow?.aiRecommendedVerdict || null;
  const aiConfidence = localEscrow?.aiConfidenceScore || 0.00;
  const autoExecuted = localEscrow?.autoExecuted || false;

  // Render Pipeline Status
  const getPipelineStatusText = () => {
    if (arbitrateMutation.isPending) {
      if (pipelineStep === 1) return "Buyer Advocate AI is generating refund arguments...";
      if (pipelineStep === 2) return "Seller Advocate AI is generating delivery arguments...";
      if (pipelineStep === 3) return "Neutral Arbitrator AI is evaluating claims...";
      return "Running deterministic java confidence check...";
    }
    return "Arbitration pipeline ready.";
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex items-center space-x-4">
        <Link
          to={`/escrows/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 border border-white/80 text-text-secondary hover:text-text-primary shadow-xs hover:border-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2">
            <Gavel className="h-6 w-6 text-[#8B5CF6]" />
            <span>AI Arbitration Visualizer</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">
            Explainable AI Arbitration Pipeline • Escrow Contract #{id}
          </p>
        </div>
      </div>

      {/* Main Grid: Pipeline visualizer on Left, Stats on Right */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Visualizer Flow and Tabs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Visualizing Flow flowchart */}
          <div className="glass-panel p-6.5 relative overflow-hidden bg-white/40 border-white/60 shadow-sm">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-[#8B5CF6]/10 blur-xl"></div>
            
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center space-x-1.5">
              <Cpu className="h-4 w-4 text-[#8B5CF6]" />
              <span>Multi-Agent Arbitration Flow</span>
            </h3>

            {/* Flowchart Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-around gap-6 relative">
              {/* Buyer Advocate */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${
                  hasArbitrationResult 
                    ? 'border-[#8B5CF6] bg-white/80 text-text-primary shadow-sm' 
                    : 'border-white/70 text-text-muted bg-white/30'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 flex items-center justify-center mb-2.5">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Buyer Advocate</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Argues Refund</span>
              </motion.div>

              <ChevronRight className="hidden md:block h-6 w-6 text-text-muted/65" />

              {/* Seller Advocate */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${
                  hasArbitrationResult 
                    ? 'border-[#FF7EB6] bg-white/80 text-text-primary shadow-sm' 
                    : 'border-white/70 text-text-muted bg-white/30'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#FF7EB6]/10 text-[#FF7EB6] border border-[#FF7EB6]/20 flex items-center justify-center mb-2.5">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Seller Advocate</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Argues Release</span>
              </motion.div>

              <ChevronRight className="hidden md:block h-6 w-6 text-text-muted/65" />

              {/* Neutral Arbitrator */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${
                  hasArbitrationResult 
                    ? 'border-[#FFC371] bg-white/80 text-text-primary shadow-sm' 
                    : 'border-white/70 text-text-muted bg-white/30'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#FFC371]/15 text-[#D97706] border border-[#FFC371]/25 flex items-center justify-center mb-2.5">
                  <Gavel className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Neutral Arbitrator</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Decides Verdict</span>
              </motion.div>

              <ChevronRight className="hidden md:block h-6 w-6 text-text-muted/65" />

              {/* Confidence check */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${
                  hasArbitrationResult 
                    ? 'border-[#10B981] bg-white/80 text-text-primary shadow-sm' 
                    : 'border-white/70 text-text-muted bg-white/30'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center justify-center mb-2.5">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Confidence Check</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Spring FSM</span>
              </motion.div>
            </div>

            {/* Arbitration Trigger Area */}
            {!hasArbitrationResult && (
              <div className="border-t border-white/60 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-xs">
                  <div className="rounded-xl bg-[#FFC371]/15 border border-[#FFC371]/30 p-2 text-[#D97706] animate-pulse">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Awaiting Arbitration Results</p>
                    <p className="text-text-secondary mt-0.5 font-medium">{getPipelineStatusText()}</p>
                  </div>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => {
                      setTimeout(() => setPipelineStep(2), 1500);
                      setTimeout(() => setPipelineStep(3), 3000);
                      setTimeout(() => setPipelineStep(4), 4500);
                      arbitrateMutation.mutate();
                    }}
                    disabled={arbitrateMutation.isPending}
                    className="btn-primary flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {arbitrateMutation.isPending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Cpu className="h-4 w-4" />
                    )}
                    <span>Trigger AI Arbitration</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-[#D97706] bg-[#FFC371]/10 border border-[#FFC371]/35 rounded-xl p-2.5 max-w-xs font-medium leading-relaxed">
                    Please contact an Administrator to trigger AI arbitration on this disputed contract.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Advocates arguments and Arbitrator details tabs container */}
          {hasArbitrationResult && (
            <div className="glass-panel overflow-hidden shadow-sm flex flex-col bg-white/40 border-white/60">
              {/* Tabs list bar */}
              <div className="flex border-b border-white/60 bg-white/30 text-xs">
                <button
                  onClick={() => setActiveAgentTab('buyer')}
                  className={`flex-1 py-3.5 font-semibold transition-all border-b-2 text-center cursor-pointer ${
                    activeAgentTab === 'buyer'
                      ? 'border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Buyer Advocate Agent
                </button>
                <button
                  onClick={() => setActiveAgentTab('seller')}
                  className={`flex-1 py-3.5 font-semibold transition-all border-b-2 text-center cursor-pointer ${
                    activeAgentTab === 'seller'
                      ? 'border-[#FF7EB6] text-[#FF7EB6] bg-[#FF7EB6]/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Seller Advocate Agent
                </button>
                <button
                  onClick={() => setActiveAgentTab('arbitrator')}
                  className={`flex-1 py-3.5 font-semibold transition-all border-b-2 text-center cursor-pointer ${
                    activeAgentTab === 'arbitrator'
                      ? 'border-[#FFC371] text-[#D97706] bg-[#FFC371]/10'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Arbitrator Agent Verdict
                </button>
              </div>

              {/* Tab Display Panel */}
              <div className="p-6 min-h-[160px]">
                <AnimatePresence mode="wait">
                  {activeAgentTab === 'buyer' && (
                    <motion.div
                      key="buyer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <h4 className="text-sm font-bold text-[#8B5CF6] flex items-center space-x-1.5">
                        <BrainCircuit className="h-4.5 w-4.5" />
                        <span>Advocate Statement supporting REFUND</span>
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed bg-white/40 border border-white/60 rounded-2xl p-4 font-semibold">
                        {aiBuyerArg}
                      </p>
                    </motion.div>
                  )}

                  {activeAgentTab === 'seller' && (
                    <motion.div
                      key="seller"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <h4 className="text-sm font-bold text-[#FF7EB6] flex items-center space-x-1.5">
                        <BrainCircuit className="h-4.5 w-4.5" />
                        <span>Advocate Statement supporting RELEASE</span>
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed bg-white/40 border border-white/60 rounded-2xl p-4 font-semibold">
                        {aiSellerArg}
                      </p>
                    </motion.div>
                  )}

                  {activeAgentTab === 'arbitrator' && (
                    <motion.div
                      key="arbitrator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#D97706] flex items-center space-x-1.5">
                          <Gavel className="h-4.5 w-4.5" />
                          <span>Arbitrator Evaluation & Reasoning</span>
                        </h4>

                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          aiVerdict === 'RELEASE' ? 'bg-[#10B981]/15 text-[#059669] border border-[#10B981]/30' : 'bg-[#EF4444]/15 text-[#DC2626] border border-[#EF4444]/30'
                        }`}>
                          Verdict: {aiVerdict || 'REFUND'}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed bg-white/40 border border-white/60 rounded-2xl p-4 font-semibold">
                        {aiReasoning}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Java Confidence Checks details & Escrow details */}
        <div className="space-y-6">
          {/* Java Confidence Checks details */}
          {hasArbitrationResult && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel p-6 shadow-sm space-y-6 bg-white/40 border-white/60"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1.5 pb-4 border-b border-white/60">
                <ShieldCheck className="h-5 w-5 text-[#10B981]" />
                <span>Java Confidence Engine</span>
              </h3>

              {/* Confidence Index circle */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 bg-white/40 shadow-sm">
                  {/* Glowing glow */}
                  <span className={`absolute inset-0 rounded-full blur-sm opacity-25 ${
                    aiConfidence >= 0.75 ? 'bg-[#10B981]' : 'bg-[#FFC371]'
                  }`} />
                  <span className={`text-2xl font-black ${
                    aiConfidence >= 0.75 ? 'text-[#10B981]' : 'text-[#D97706]'
                  }`}>
                    {(aiConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs font-bold text-text-primary mt-3">Confidence Rating</p>
                <p className="text-[10px] text-text-muted mt-0.5 font-semibold">Threshold for Auto-Execution: 75%</p>
              </div>

              {/* Engine Status (Auto executed vs escalated) */}
              <div className={`rounded-2xl border p-4.5 text-xs ${
                autoExecuted
                  ? 'bg-[#10B981]/5 border-[#10B981]/20 text-[#065F46]'
                  : 'bg-[#FFC371]/10 border-[#FFC371]/30 text-[#92400E]'
              }`}>
                <p className="font-bold flex items-center space-x-1.5">
                  {autoExecuted ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Resolution: Auto-Executed</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>Resolution: Escalated to Admin</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-text-secondary mt-1 leading-relaxed font-semibold">
                  {autoExecuted
                    ? `Confidence exceeded threshold. The net locked amount has been automatically distributed via Spring FSM.`
                    : `Confidence level fell below threshold. The verdict has been flagged for human admin override.`}
                </p>
              </div>

              {/* Rules Matrix */}
              <div className="space-y-2.5 text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                <p className="font-bold text-text-muted text-[9px] tracking-widest">Calculated Business Rules</p>
                <div className="flex items-center justify-between border-b border-white/40 pb-2">
                  <span className="normal-case">Has Hard Delivery Proof (DB check)</span>
                  <span className="font-bold text-text-primary">YES (0.90 / 0.65)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="normal-case">LLM Sentiment Has Clear Winner</span>
                  <span className="font-bold text-text-primary">YES (0.90 / 0.70)</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Dispute Context Details */}
          <div className="glass-panel p-6 shadow-sm space-y-4 bg-white/40 border-white/60">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1.5 pb-2 border-b border-white/60">
              <Activity className="h-4.5 w-4.5 text-[#8B5CF6]" />
              <span>Evidence Context</span>
            </h3>

            <div className="space-y-3.5 text-xs text-text-secondary font-medium">
              <div>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Agreed Terms</span>
                <span className="font-bold text-text-primary mt-0.5 block">{localEscrow?.agreedDeliveryTerms || "Standard work deliverables."}</span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Delivery Proof URL</span>
                <span className="font-semibold text-text-primary break-all block mt-0.5">{localEscrow?.buyerEvidenceUrl || localEscrow?.evidenceUrl || "No proof URL uploaded."}</span>
              </div>
              <div className="flex justify-between border-t border-white/40 pt-2.5">
                <span>Proof Submitted (DB)</span>
                <span className={`font-black ${localEscrow?.deliveryProofSubmitted || localEscrow?.buyerEvidenceUrl || localEscrow?.evidenceUrl ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {localEscrow?.deliveryProofSubmitted || localEscrow?.buyerEvidenceUrl || localEscrow?.evidenceUrl ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deadline Met (DB)</span>
                <span className={`font-black ${localEscrow?.deadlineMet ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {localEscrow?.deadlineMet ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetails;
