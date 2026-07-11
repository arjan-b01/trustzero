import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import disputeService from '../../services/dispute.service';
import authService from '../../services/auth.service';
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
  const [buyerStep, setBuyerStep] = useState('idle'); // 'idle' | 'processing' | 'completed'
  const [sellerStep, setSellerStep] = useState('idle');
  const [arbitratorStep, setArbitratorStep] = useState('idle');
  const [fsmStep, setFsmStep] = useState('idle');

  // 1. Fetch Escrow Details (which has disputeReason, status, etc.)
  const { data: escrow, isLoading: isEscrowLoading } = useQuery({
    queryKey: ['escrow', id, userEmail],
    queryFn: () => escrowService.getEscrowById(userEmail, id),
    enabled: !!id && !!userEmail
  });

  // 2. Fetch Dispute Record from database
  const { data: disputeRecord, isLoading: isDisputeLoading, refetch: refetchDispute } = useQuery({
    queryKey: ['dispute-record', id],
    queryFn: () => escrowService.getDisputeRecord(id),
    enabled: !!id && (escrow?.status === 'DISPUTED' || escrow?.status === 'RELEASED' || escrow?.status === 'REFUNDED'),
    retry: false
  });

  const [isArbitrating, setIsArbitrating] = useState(false);
  const [streamBuyerArg, setStreamBuyerArg] = useState('');
  const [streamSellerArg, setStreamSellerArg] = useState('');
  const [streamReasoning, setStreamReasoning] = useState('');
  const [streamVerdict, setStreamVerdict] = useState('');
  const [streamConfidence, setStreamConfidence] = useState(0);
  const [streamAutoExecuted, setStreamAutoExecuted] = useState(false);

  // Typewriter effect for dramatic agent reveal
  const typewriter = async (text, setter, speed = 5) => {
    setter('');
    for (let i = 0; i < text.length; i++) {
      setter(text.substring(0, i + 1));
      await new Promise(r => setTimeout(r, speed));
    }
  };

  const triggerArbitrationStream = () => {
    setIsArbitrating(true);
    setPipelineStep(1);
    setStreamBuyerArg('');
    setStreamSellerArg('');
    setStreamReasoning('');
    setStreamVerdict('');
    setStreamConfidence(0);
    setStreamAutoExecuted(false);
    
    setBuyerStep('processing');
    setSellerStep('idle');
    setArbitratorStep('idle');
    setFsmStep('idle');
 
    const token = authService.getToken();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const eventSource = new EventSource(`${baseUrl}/escrow/${id}/arbitrate/stream?token=${token}`);
 
    eventSource.onmessage = async (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("Arbitration Stream Event:", parsed);

        if (parsed.type === 'progress') {
          if (parsed.message && parsed.message.includes('parallel')) {
            setPipelineStep(2);
            setBuyerStep('processing');
            setSellerStep('processing');
          }
          toast.loading(parsed.message, { id: 'arb-stream-toast' });
        } else if (parsed.type === 'agent_start') {
          if (parsed.agent === 'evidence_analyst') {
            setPipelineStep(1);
            toast.loading('Evidence Analyst is reviewing the case...', { id: 'arb-stream-toast' });
          } else if (parsed.agent === 'arbitrator') {
            setPipelineStep(3);
            setBuyerStep('completed');
            setSellerStep('completed');
            setArbitratorStep('processing');
            toast.loading('Arbitrator is deliberating...', { id: 'arb-stream-toast' });
          }
        } else if (parsed.type === 'agent_complete') {
          if (parsed.agent === 'evidence_analyst') {
            // Evidence analyst done — move to advocates
            setPipelineStep(2);
            setBuyerStep('processing');
            setSellerStep('processing');
          } else if (parsed.agent === 'buyer_advocate') {
            const text = typeof parsed.data === 'string' ? parsed.data : (parsed.message || '');
            typewriter(text, setStreamBuyerArg, 4);
            setBuyerStep('completed');
          } else if (parsed.agent === 'seller_advocate') {
            const text = typeof parsed.data === 'string' ? parsed.data : (parsed.message || '');
            typewriter(text, setStreamSellerArg, 4);
            setSellerStep('completed');
          }
        } else if (parsed.type === 'verdict') {
          const vData = parsed.data;
          
          // First: typewriter the arbitrator's reasoning (dramatic)
          await typewriter(vData.reasoning || '', setStreamReasoning, 8);
          setArbitratorStep('completed');
          setFsmStep('processing');
          
          // Brief dramatic pause before revealing verdict
          await new Promise(r => setTimeout(r, 800));
          
          // Then: reveal the verdict + confidence
          setStreamVerdict(vData.verdict);
          setStreamConfidence(vData.confidence);
          setStreamAutoExecuted(vData.confidence >= 0.75);
          setPipelineStep(4);

          const verdictLabel = vData.verdict === 'REFUND' ? 'Refund to Buyer' : 'Release to Seller';
          toast.success(`Verdict: ${verdictLabel} (${(vData.confidence * 100).toFixed(0)}% confidence)`, { id: 'arb-stream-toast', duration: 6000 });

          setTimeout(() => setFsmStep('completed'), 1500);

          setTimeout(() => {
            eventSource.close();
            setIsArbitrating(false);
            queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
            queryClient.invalidateQueries({ queryKey: ['dispute-record', id] });
            refetchDispute();
          }, 4000);
        } else if (parsed.type === 'error') {
          toast.error(`Arbitration failed: ${parsed.message}`, { id: 'arb-stream-toast' });
          eventSource.close();
          setIsArbitrating(false);
        }
      } catch (err) {
        console.error("SSE JSON parse error:", err);
      }
    };
 
    eventSource.onerror = (err) => {
      console.log("EventSource closed or disconnected.", err);
      // Fallback clean up
      setTimeout(() => {
        eventSource.close();
        setIsArbitrating(false);
        queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
        queryClient.invalidateQueries({ queryKey: ['dispute-record', id] });
        refetchDispute();
      }, 5000);
    };
  };

  if (isEscrowLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent"></div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  // Get values from DB disputeRecord or fallback to local storage / stream state
  const aiBuyerArg = streamBuyerArg || disputeRecord?.aiBuyerArgument || "The Buyer Advocate AI will formulate arguments supporting a refund...";
  const aiSellerArg = streamSellerArg || disputeRecord?.aiSellerArgument || "The Seller Advocate AI will formulate arguments supporting payment release...";
  const aiReasoning = streamReasoning || disputeRecord?.aiReasoning || "The Neutral Arbitrator AI will balance evidence and make a final ruling...";
  const aiVerdict = streamVerdict || disputeRecord?.aiRecommendedVerdict || null;
  const aiConfidence = streamConfidence || disputeRecord?.aiConfidenceScore || 0.00;
  const autoExecuted = streamAutoExecuted || disputeRecord?.autoExecuted || false;

  const hasArbitrationResult = !!aiVerdict || escrow?.status === 'RELEASED' || escrow?.status === 'REFUNDED';

  // Render Pipeline Status
  const getPipelineStatusText = () => {
    if (isArbitrating) {
      if (buyerStep === 'processing') return "Analyzing Buyer's Evidence...";
      if (sellerStep === 'processing') return "Analyzing Seller's Evidence...";
      if (arbitratorStep === 'processing') return "Evaluating arguments & deciding verdict...";
      if (fsmStep === 'processing') return "Validating confidence score & final resolution...";
      return "Running Spring FSM confidence checks...";
    }
    return "Arbitration pipeline ready.";
  };

  const isBuyerCompleted = hasArbitrationResult || buyerStep === 'completed';
  const isSellerCompleted = hasArbitrationResult || sellerStep === 'completed';
  const isArbitratorCompleted = hasArbitrationResult || arbitratorStep === 'completed';
  const isFsmCompleted = hasArbitrationResult || fsmStep === 'completed';

  const buyerBorder = isBuyerCompleted 
    ? 'border-[#10B981] bg-[#10B981]/5 text-text-primary shadow-sm' 
    : (buyerStep === 'processing' 
      ? 'border-[#8B5CF6] bg-white/85 text-text-primary shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse' 
      : 'border-white/70 text-text-muted bg-white/30');

  const buyerIconBg = isBuyerCompleted 
    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' 
    : (buyerStep === 'processing' 
      ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 animate-pulse scale-105' 
      : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20');

  const sellerBorder = isSellerCompleted 
    ? 'border-[#10B981] bg-[#10B981]/5 text-text-primary shadow-sm' 
    : (sellerStep === 'processing' 
      ? 'border-[#8B5CF6] bg-white/85 text-text-primary shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse' 
      : 'border-white/70 text-text-muted bg-white/30');

  const sellerIconBg = isSellerCompleted 
    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' 
    : (sellerStep === 'processing' 
      ? 'bg-[#FF7EB6]/20 text-[#FF7EB6] border border-[#FF7EB6]/30 animate-pulse scale-105' 
      : 'bg-[#FF7EB6]/10 text-[#FF7EB6] border border-[#FF7EB6]/20');

  const arbitratorBorder = isArbitratorCompleted 
    ? 'border-[#10B981] bg-[#10B981]/5 text-text-primary shadow-sm' 
    : (arbitratorStep === 'processing' 
      ? 'border-[#8B5CF6] bg-white/85 text-text-primary shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse' 
      : 'border-white/70 text-text-muted bg-white/30');

  const arbitratorIconBg = isArbitratorCompleted 
    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' 
    : (arbitratorStep === 'processing' 
      ? 'bg-[#FFC371]/20 text-[#D97706] border border-[#FFC371]/30 animate-pulse scale-105' 
      : 'bg-[#FFC371]/15 text-[#D97706] border border-[#FFC371]/25');

  const fsmBorder = isFsmCompleted 
    ? 'border-[#10B981] bg-[#10B981]/5 text-text-primary shadow-sm' 
    : (fsmStep === 'processing' 
      ? 'border-[#8B5CF6] bg-white/85 text-text-primary shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse' 
      : 'border-white/70 text-text-muted bg-white/30');

  const fsmIconBg = isFsmCompleted 
    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' 
    : (fsmStep === 'processing' 
      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 animate-pulse scale-105' 
      : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20');

  const arrow1Class = buyerStep === 'processing' ? 'text-[#8B5CF6] animate-pulse scale-110' : 'text-text-muted/65';
  const arrow2Class = sellerStep === 'processing' ? 'text-[#8B5CF6] animate-pulse scale-110' : 'text-text-muted/65';
  const arrow3Class = arbitratorStep === 'processing' ? 'text-[#8B5CF6] animate-pulse scale-110' : 'text-text-muted/65';

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
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${buyerBorder}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2.5 transition-all duration-300 ${buyerIconBg}`}>
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Buyer Advocate</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Argues Refund</span>
              </motion.div>
 
              <ChevronRight className={`hidden md:block h-6 w-6 transition-all duration-300 ${arrow1Class}`} />
 
              {/* Seller Advocate */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${sellerBorder}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2.5 transition-all duration-300 ${sellerIconBg}`}>
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Seller Advocate</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Argues Release</span>
              </motion.div>
 
              <ChevronRight className={`hidden md:block h-6 w-6 transition-all duration-300 ${arrow2Class}`} />
 
              {/* Neutral Arbitrator */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${arbitratorBorder}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2.5 transition-all duration-300 ${arbitratorIconBg}`}>
                  <Gavel className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Neutral Arbitrator</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1.5">Decides Verdict</span>
              </motion.div>
 
              <ChevronRight className={`hidden md:block h-6 w-6 transition-all duration-300 ${arrow3Class}`} />
 
              {/* Confidence check */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`flex flex-col items-center p-4.5 rounded-2xl border text-center max-w-[130px] transition-all shadow-2xs ${fsmBorder}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2.5 transition-all duration-300 ${fsmIconBg}`}>
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
                    onClick={triggerArbitrationStream}
                    disabled={isArbitrating}
                    className="btn-primary flex items-center space-x-2.5 px-6 py-3 text-sm font-bold shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isArbitrating ? (
                      <>
                        <Loader className="h-4.5 w-4.5 animate-spin" />
                        <span>AI Arbitration in Progress...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="h-4.5 w-4.5" />
                        <span>Trigger AI Arbitration</span>
                      </>
                    )}
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
                  className={`flex-1 py-3.5 font-semibold transition-all border-b-2 text-center cursor-pointer ${activeAgentTab === 'buyer'
                      ? 'border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                  Buyer Advocate Agent
                </button>
                <button
                  onClick={() => setActiveAgentTab('seller')}
                  className={`flex-1 py-3.5 font-semibold transition-all border-b-2 text-center cursor-pointer ${activeAgentTab === 'seller'
                      ? 'border-[#FF7EB6] text-[#FF7EB6] bg-[#FF7EB6]/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                  Seller Advocate Agent
                </button>
                <button
                  onClick={() => setActiveAgentTab('arbitrator')}
                  className={`flex-1 py-3.5 font-semibold transition-all border-b-2 text-center cursor-pointer ${activeAgentTab === 'arbitrator'
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

                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${aiVerdict === 'RELEASE' ? 'bg-[#10B981]/15 text-[#059669] border border-[#10B981]/30' : 'bg-[#EF4444]/15 text-[#DC2626] border border-[#EF4444]/30'
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
                  <span className={`absolute inset-0 rounded-full blur-sm opacity-25 ${aiConfidence >= 0.75 ? 'bg-[#10B981]' : 'bg-[#FFC371]'
                    }`} />
                  <span className={`text-2xl font-black ${aiConfidence >= 0.75 ? 'text-[#10B981]' : 'text-[#D97706]'
                    }`}>
                    {(aiConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs font-bold text-text-primary mt-3">Confidence Rating</p>
                <p className="text-[10px] text-text-muted mt-0.5 font-semibold">Threshold for Auto-Execution: 75%</p>
              </div>

              {/* Engine Status (Auto executed vs escalated) */}
              <div className={`rounded-2xl border p-4.5 text-xs ${autoExecuted
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
                <span className="font-bold text-text-primary mt-0.5 block">{disputeRecord?.agreedDeliveryTerms || "Standard work deliverables."}</span>
              </div>
              <div>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Delivery Proof URL</span>
                <span className="font-semibold text-text-primary break-all block mt-0.5">{disputeRecord?.buyerEvidenceUrl || disputeRecord?.sellerEvidenceUrl || "No proof URL uploaded."}</span>
              </div>
              <div className="flex justify-between border-t border-white/40 pt-2.5">
                <span>Proof Submitted (DB)</span>
                <span className={`font-black ${disputeRecord?.buyerEvidenceUrl || disputeRecord?.sellerEvidenceUrl ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {disputeRecord?.buyerEvidenceUrl || disputeRecord?.sellerEvidenceUrl ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deadline Met (DB)</span>
                <span className="font-black text-[#10B981]">
                  TRUE
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
