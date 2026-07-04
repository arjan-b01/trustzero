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
  Loader
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
  // In the real Spring Boot backend, the dispute record fields can be mocked/supplemented if the escrow status is DISPUTED.
  // We can look at the local storage list to see if the record has AI arguments saved on it.
  const escrows = escrowService.getEscrowList(userEmail);
  const localEscrow = escrows.find(e => e.id === Number(id));

  const hasArbitrationResult = localEscrow?.aiRecommendedVerdict || escrow?.status === 'RELEASED' || escrow?.status === 'REFUNDED';

  // 3. Trigger Arbitration Mutation (Admin only)
  const arbitrateMutation = useMutation({
    mutationFn: () => disputeService.arbitrate(userEmail, id),
    onMutate: () => {
      // Start pipeline animation
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
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
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-dark border border-border-dark text-text-secondary hover:text-text-primary transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2">
            <Gavel className="h-6 w-6 text-brand-primary" />
            <span>AI Arbitration Visualizer</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Explainable AI Arbitration Pipeline • Escrow Contract #{id}
          </p>
        </div>
      </div>

      {/* Main Grid: Pipeline visualizer on Left, Stats on Right */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Visualizer Flow and Tabs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Visualizing Flow flowchart */}
          <div className="rounded-2xl glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-brand-primary/10 blur-xl"></div>
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-6 flex items-center space-x-1.5">
              <Cpu className="h-4 w-4 text-brand-secondary" />
              <span>Multi-Agent Arbitration Flow</span>
            </h3>

            {/* Flowchart Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-around gap-6 relative">
              {/* Buyer Advocate */}
              <div className={`flex flex-col items-center p-3 rounded-xl border text-center max-w-[120px] transition-all ${
                hasArbitrationResult ? 'border-brand-primary bg-brand-primary/5 text-text-primary' : 'border-border-dark text-text-muted bg-bg-dark/40'
              }`}>
                <BrainCircuit className="h-8 w-8 text-brand-primary mb-2" />
                <span className="text-xs font-bold">Buyer Advocate</span>
                <span className="text-[10px] text-text-muted mt-1">Argues Refund</span>
              </div>

              <ChevronRight className="hidden md:block h-6 w-6 text-text-muted" />

              {/* Seller Advocate */}
              <div className={`flex flex-col items-center p-3 rounded-xl border text-center max-w-[120px] transition-all ${
                hasArbitrationResult ? 'border-brand-accent bg-brand-accent/5 text-text-primary' : 'border-border-dark text-text-muted bg-bg-dark/40'
              }`}>
                <BrainCircuit className="h-8 w-8 text-brand-accent mb-2" />
                <span className="text-xs font-bold">Seller Advocate</span>
                <span className="text-[10px] text-text-muted mt-1">Argues Release</span>
              </div>

              <ChevronRight className="hidden md:block h-6 w-6 text-text-muted" />

              {/* Neutral Arbitrator */}
              <div className={`flex flex-col items-center p-3 rounded-xl border text-center max-w-[120px] transition-all ${
                hasArbitrationResult ? 'border-brand-secondary bg-brand-secondary/5 text-text-primary' : 'border-border-dark text-text-muted bg-bg-dark/40'
              }`}>
                <Gavel className="h-8 w-8 text-brand-secondary mb-2" />
                <span className="text-xs font-bold">Neutral Arbitrator</span>
                <span className="text-[10px] text-text-muted mt-1">Decides Verdict</span>
              </div>

              <ChevronRight className="hidden md:block h-6 w-6 text-text-muted" />

              {/* Confidence check */}
              <div className={`flex flex-col items-center p-3 rounded-xl border text-center max-w-[120px] transition-all ${
                hasArbitrationResult ? 'border-success bg-success/5 text-text-primary' : 'border-border-dark text-text-muted bg-bg-dark/40'
              }`}>
                <Award className="h-8 w-8 text-success mb-2" />
                <span className="text-xs font-bold">Confidence Engine</span>
                <span className="text-[10px] text-text-muted mt-1">Java Business Check</span>
              </div>
            </div>

            {/* Arbitration Trigger Area */}
            {!hasArbitrationResult && (
              <div className="border-t border-border-dark pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-xs">
                  <div className="rounded-full bg-warning/10 p-2 text-warning animate-pulse">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Awaiting Arbitration Results</p>
                    <p className="text-text-muted">{getPipelineStatusText()}</p>
                  </div>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => {
                      // Cycle pipeline steps mock timings
                      setTimeout(() => setPipelineStep(2), 1500);
                      setTimeout(() => setPipelineStep(3), 3000);
                      setTimeout(() => setPipelineStep(4), 4500);
                      arbitrateMutation.mutate();
                    }}
                    disabled={arbitrateMutation.isPending}
                    className="flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-5 py-2.5 text-sm font-semibold text-text-primary shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {arbitrateMutation.isPending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Cpu className="h-4 w-4" />
                    )}
                    <span>Trigger AI Arbitration</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-warning bg-warning/5 border border-warning/20 rounded-lg p-2 max-w-xs">
                    Please contact an Administrator to trigger AI arbitration on this disputed contract.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Advocates arguments and Arbitrator details tabs container */}
          {hasArbitrationResult && (
            <div className="rounded-2xl glass-panel overflow-hidden shadow-sm flex flex-col">
              {/* Tabs list bar */}
              <div className="flex border-b border-border-dark bg-card-dark/20 text-xs">
                <button
                  onClick={() => setActiveAgentTab('buyer')}
                  className={`flex-1 py-3 font-semibold transition-all border-b-2 text-center cursor-pointer ${
                    activeAgentTab === 'buyer'
                      ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Buyer Advocate Agent
                </button>
                <button
                  onClick={() => setActiveAgentTab('seller')}
                  className={`flex-1 py-3 font-semibold transition-all border-b-2 text-center cursor-pointer ${
                    activeAgentTab === 'seller'
                      ? 'border-brand-accent text-brand-accent bg-brand-accent/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Seller Advocate Agent
                </button>
                <button
                  onClick={() => setActiveAgentTab('arbitrator')}
                  className={`flex-1 py-3 font-semibold transition-all border-b-2 text-center cursor-pointer ${
                    activeAgentTab === 'arbitrator'
                      ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/5'
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
                      <h4 className="text-sm font-bold text-brand-primary flex items-center space-x-1.5">
                        <BrainCircuit className="h-4 w-4" />
                        <span>Advocate Statement supporting REFUND</span>
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed bg-bg-dark/40 border border-border-dark/30 rounded-xl p-4">
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
                      <h4 className="text-sm font-bold text-brand-accent flex items-center space-x-1.5">
                        <BrainCircuit className="h-4 w-4" />
                        <span>Advocate Statement supporting RELEASE</span>
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed bg-bg-dark/40 border border-border-dark/30 rounded-xl p-4">
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
                        <h4 className="text-sm font-bold text-brand-secondary flex items-center space-x-1.5">
                          <Gavel className="h-4 w-4" />
                          <span>Arbitrator Evaluation & Reasoning</span>
                        </h4>

                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          aiVerdict === 'RELEASE' ? 'bg-success/15 text-success border border-success/30' : 'bg-danger/15 text-danger border border-danger/30'
                        }`}>
                          Verdict: {aiVerdict || 'REFUND'}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed bg-bg-dark/40 border border-border-dark/30 rounded-xl p-4">
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
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl glass-panel p-6 shadow-sm space-y-6"
            >
              <h3 className="text-sm font-bold text-text-primary flex items-center space-x-1.5 pb-4 border-b border-border-dark">
                <ShieldCheck className="h-5 w-5 text-success" />
                <span>Java Confidence Engine</span>
              </h3>

              {/* Confidence Index circle */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-card-dark bg-bg-dark/50">
                  {/* Glowing glow */}
                  <span className={`absolute inset-0 rounded-full blur-xs opacity-20 ${
                    aiConfidence >= 0.75 ? 'bg-success' : 'bg-warning'
                  }`} />
                  <span className={`text-2xl font-black ${
                    aiConfidence >= 0.75 ? 'text-success' : 'text-warning'
                  }`}>
                    {(aiConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs font-bold text-text-primary mt-3">Confidence Rating</p>
                <p className="text-[10px] text-text-muted mt-0.5">Threshold for Auto-Execution: 75%</p>
              </div>

              {/* Engine Status (Auto executed vs escalated) */}
              <div className={`rounded-xl border p-4 text-xs ${
                autoExecuted
                  ? 'bg-success/5 border-success/20 text-success'
                  : 'bg-warning/5 border-warning/20 text-warning'
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
                <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                  {autoExecuted
                    ? `Confidence exceeded threshold. The net locked amount has been automatically distributed via Spring FSM.`
                    : `Confidence level fell below threshold. The verdict has been flagged for human admin override.`}
                </p>
              </div>

              {/* Rules Matrix */}
              <div className="space-y-2.5 text-[10px] text-text-secondary">
                <p className="font-bold uppercase tracking-wider text-text-muted">Calculated Business Rules</p>
                <div className="flex items-center justify-between">
                  <span>Has Hard Delivery Proof (DB check)</span>
                  <span className="font-bold text-text-primary">YES (0.90 / 0.65)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>LLM Sentiment Has Clear Winner</span>
                  <span className="font-bold text-text-primary">YES (0.90 / 0.70)</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Dispute Context Details */}
          <div className="rounded-2xl glass-panel p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center space-x-1.5 pb-2 border-b border-border-dark">
              <Activity className="h-4.5 w-4.5 text-brand-primary" />
              <span>Evidence Context</span>
            </h3>

            <div className="space-y-3 text-xs text-text-secondary">
              <div>
                <span className="text-[10px] text-text-muted font-medium block">Agreed Terms</span>
                <span className="font-semibold text-text-primary">{localEscrow?.agreedDeliveryTerms || "Standard work deliverables."}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-medium block">Delivery Proof URL</span>
                <span className="font-semibold text-text-primary break-all">{localEscrow?.evidenceUrl || "No proof URL uploaded."}</span>
              </div>
              <div className="flex justify-between">
                <span>Proof Submitted (DB)</span>
                <span className={`font-bold ${localEscrow?.deliveryProofSubmitted ? 'text-success' : 'text-danger'}`}>
                  {localEscrow?.deliveryProofSubmitted ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deadline Met (DB)</span>
                <span className={`font-bold ${localEscrow?.deadlineMet ? 'text-success' : 'text-danger'}`}>
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
