import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import authService from '../../services/auth.service';
import { getAbsoluteUrl } from '../../services/api';
import {
  Gavel,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Cpu,
  BrainCircuit,
  Award,
  Clock,
  AlertTriangle,
  Loader,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Radio,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────────
   useTypewriter
   Streams `text` character-by-character.
   `enabled` = true  → animate (during live stream)
   `enabled` = false → show text instantly (from DB on load)
   Returns { displayed, isDone }
───────────────────────────────────────────────────────────────────────────── */
function useTypewriter(text, speed = 14, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef(null);
  const prevText = useRef('');

  useEffect(() => {
    // Instant display when not animating (e.g. data loaded from DB)
    if (!enabled) {
      setDisplayed(text || '');
      setIsDone(true);
      prevText.current = text || '';
      return;
    }

    if (!text) {
      setDisplayed('');
      setIsDone(false);
      return;
    }

    // New text arrived — start from scratch
    if (text !== prevText.current) {
      prevText.current = text;
      setDisplayed('');
      setIsDone(false);
      let i = 0;

      const tick = () => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i < text.length) {
          timerRef.current = setTimeout(tick, speed);
        } else {
          setIsDone(true);
        }
      };

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tick, speed);
    }

    return () => clearTimeout(timerRef.current);
  }, [text, speed, enabled]);

  return { displayed, isDone };
}

/* ─────────────────────────────────────────────────────────────────────────────
   AgentPanel
   One of the three agent output panels. Shows:
   – idle:       subtle placeholder
   – processing: spinner
   – typing:     typewriter text with blinking cursor
   – done:       full text
───────────────────────────────────────────────────────────────────────────── */
function AgentPanel({
  label,
  sublabel,
  icon: Icon,
  borderClass,
  headerClass,
  agentStep,     // 'idle' | 'processing' | 'completed'
  text,          // resolved text to display (DB wins over stream in parent)
  animate,       // true = typewriter; false = instant
}) {
  const { displayed, isDone } = useTypewriter(text || '', 13, animate && !!text);

  const isActive = agentStep === 'processing';
  const hasDone  = agentStep === 'completed' || !!text;

  return (
    <div className={`flex flex-col rounded-2xl border bg-white/40 shadow-sm transition-all duration-500 ${borderClass}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-white/50 rounded-t-2xl ${headerClass}`}>
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/30 border border-white/50">
          <Icon className="h-4 w-4" />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-current animate-ping" />
          )}
          {hasDone && !isActive && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] border-2 border-white" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold">{label}</p>
          <p className="text-[10px] font-semibold opacity-70 uppercase tracking-widest mt-0.5">{sublabel}</p>
        </div>
        {isActive && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
            Live
          </span>
        )}
        {hasDone && !isActive && (
          <CheckCircle className="h-4 w-4 text-[#10B981]" />
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 min-h-[130px] font-mono text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">
        {agentStep === 'idle' && !text && (
          <span className="italic text-text-muted opacity-60">
            Waiting for previous agent to complete...
          </span>
        )}

        {agentStep === 'processing' && !text && (
          <span className="flex items-center gap-2 text-text-muted">
            <Loader className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
            <span className="italic">Agent is formulating arguments from evidence...</span>
          </span>
        )}

        {text && (
          <>
            {displayed}
            {animate && !isDone && (
              <span
                className="inline-block w-[2px] h-[1em] bg-current ml-[1px] align-middle"
                style={{ animation: 'tzBlink 0.75s step-end infinite' }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DisputeDetails — main component
───────────────────────────────────────────────────────────────────────────── */
export const DisputeDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  const queryClient = useQueryClient();

  /* ── Pipeline step states ─────────────────────────────────────────────── */
  const [buyerStep, setBuyerStep] = useState('idle');
  const [sellerStep, setSellerStep] = useState('idle');
  const [arbitratorStep, setArbitratorStep] = useState('idle');
  const [fsmStep, setFsmStep] = useState('idle');

  /* ── Streaming payloads ───────────────────────────────────────────────── */
  const [isArbitrating, setIsArbitrating] = useState(false);
  const [streamBuyerArg, setStreamBuyerArg] = useState('');
  const [streamSellerArg, setStreamSellerArg] = useState('');
  const [streamReasoning, setStreamReasoning] = useState('');
  const [streamVerdict, setStreamVerdict] = useState('');
  const [streamConfidence, setStreamConfidence] = useState(0);
  const [streamAutoExecuted, setStreamAutoExecuted] = useState(false);

  /* ── Panel visibility ─────────────────────────────────────────────────── */
  // Start open if the escrow URL was reached from the archive (already resolved)
  const [showLivePanel, setShowLivePanel] = useState(false);

  /* ── Data queries ─────────────────────────────────────────────────────── */
  const { data: escrow, isLoading: isEscrowLoading } = useQuery({
    queryKey: ['escrow', id, userEmail],
    queryFn: () => escrowService.getEscrowById(userEmail, id),
    enabled: !!id && !!userEmail,
  });

  const {
    data: disputeRecord,
    refetch: refetchDispute,
  } = useQuery({
    queryKey: ['dispute-record', id],
    queryFn: () => escrowService.getDisputeRecord(id),
    enabled:
      !!id &&
      (escrow?.status === 'DISPUTED' ||
        escrow?.status === 'RELEASED' ||
        escrow?.status === 'REFUNDED'),
    retry: false,
  });

  /* ── Derived values ───────────────────────────────────────────────────── */
  // Stream values take priority so the typewriter fires.
  // DB values are fallback (shown instantly when loaded).
  const liveByuerArg   = streamBuyerArg;
  const liveSellerArg  = streamSellerArg;
  const liveReasoning  = streamReasoning;
  const dbBuyerArg     = disputeRecord?.aiBuyerArgument   || '';
  const dbSellerArg    = disputeRecord?.aiSellerArgument  || '';
  const dbReasoning    = disputeRecord?.aiReasoning        || '';

  // DB data is authoritative once it exists. Stream text is only used
  // during the live run before DB is populated (transient overlay).
  const buyerArgText   = dbBuyerArg  || liveByuerArg;
  const sellerArgText  = dbSellerArg || liveSellerArg;
  const reasoningText  = dbReasoning || liveReasoning;

  const aiVerdict      = streamVerdict    || disputeRecord?.aiRecommendedVerdict || null;
  const aiConfidence   = streamConfidence || disputeRecord?.aiConfidenceScore    || 0;
  const autoExecuted   = streamAutoExecuted || disputeRecord?.autoExecuted       || false;

  const hasResult =
    !!aiVerdict ||
    escrow?.status === 'RELEASED' ||
    escrow?.status === 'REFUNDED';

  // Auto-open panel whenever there is a result (escrow resolved or stream done)
  useEffect(() => {
    if (hasResult || isArbitrating) setShowLivePanel(true);
  }, [hasResult, isArbitrating]);

  // Also open immediately when escrow data first arrives and is already resolved
  // (handles direct navigation to /disputes/:id from the archive)
  useEffect(() => {
    if (
      escrow?.status === 'RELEASED' ||
      escrow?.status === 'REFUNDED'
    ) {
      setShowLivePanel(true);
    }
  }, [escrow?.status]);

  // When DB data loads fresh (e.g. page opened after arbitration done),
  // mark pipeline stages as completed so UI reflects reality
  useEffect(() => {
    if (disputeRecord?.aiBuyerArgument)  setBuyerStep('completed');
    if (disputeRecord?.aiSellerArgument) setSellerStep('completed');
    if (disputeRecord?.aiReasoning)      setArbitratorStep('completed');
    if (hasResult)                       setFsmStep('completed');
  }, [disputeRecord, hasResult]);

  /* ── Arbitration stream ───────────────────────────────────────────────── */
  // Track how many advocates have completed so we know when to start arbitrator
  const advocatesCompleted = useRef(0);

  const triggerArbitrationStream = () => {
    setIsArbitrating(true);
    setShowLivePanel(true);
    setStreamBuyerArg('');
    setStreamSellerArg('');
    setStreamReasoning('');
    setStreamVerdict('');
    setStreamConfidence(0);
    setStreamAutoExecuted(false);
    advocatesCompleted.current = 0;

    // Both advocates start simultaneously — parallel execution
    setBuyerStep('processing');
    setSellerStep('processing');
    setArbitratorStep('idle');
    setFsmStep('idle');

    const token = authService.getToken();
    const url = getAbsoluteUrl(`/api/escrow/${id}/arbitrate/stream?token=${token}`);
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log('Arbitration SSE:', parsed);

        if (parsed.type === 'progress') {
          toast.loading(parsed.message, { id: 'arb-toast' });
        }

        else if (parsed.type === 'agent_start') {
          // Advocates run in parallel — just confirm processing state, don't override the other
          if (parsed.agent === 'buyer_advocate') {
            setBuyerStep('processing');
          } else if (parsed.agent === 'seller_advocate') {
            setSellerStep('processing');
          } else if (parsed.agent === 'arbitrator') {
            // Arbitrator starts after both advocates complete
            setBuyerStep(s => s !== 'completed' ? 'completed' : s);
            setSellerStep(s => s !== 'completed' ? 'completed' : s);
            setArbitratorStep('processing');
          }
        }

        else if (parsed.type === 'agent_complete') {
          // parsed.data = the actual argument text; parsed.message = status label
          const argText = typeof parsed.data === 'string'
            ? parsed.data
            : (parsed.content || parsed.argument || JSON.stringify(parsed.data) || '');
          console.log('[SSE agent_complete]', parsed.agent, '→ argText length:', argText.length, 'first 80 chars:', argText.slice(0, 80));
          if (parsed.agent === 'buyer_advocate') {
            setStreamBuyerArg(argText);
            setBuyerStep('completed');
            advocatesCompleted.current += 1;
            if (advocatesCompleted.current >= 2) setArbitratorStep('processing');
          } else if (parsed.agent === 'seller_advocate') {
            setStreamSellerArg(argText);
            setSellerStep('completed');
            advocatesCompleted.current += 1;
            if (advocatesCompleted.current >= 2) setArbitratorStep('processing');
          }
        }

        else if (parsed.type === 'verdict') {
          const v = parsed.data;
          setStreamReasoning(v.reasoning);
          setStreamVerdict(v.verdict);
          setStreamConfidence(v.confidence);
          setStreamAutoExecuted(v.confidence >= 0.75);

          setArbitratorStep('completed');
          setFsmStep('processing');

          toast.success(
            `Verdict: ${v.verdict} — Confidence: ${(v.confidence * 100).toFixed(0)}%`,
            { id: 'arb-toast' }
          );

          setTimeout(() => setFsmStep('completed'), 1500);

          setTimeout(() => {
            eventSource.close();
            setIsArbitrating(false);
            // Don't clear stream states here — DB data will override them
            // once the refetch completes (DB wins when present)
            queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
            queryClient.invalidateQueries({ queryKey: ['dispute-record', id] });
            refetchDispute();
          }, 3000);
        }

        else if (parsed.type === 'error') {
          toast.error(`Arbitration failed: ${parsed.message}`, { id: 'arb-toast' });
          eventSource.close();
          setIsArbitrating(false);
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    eventSource.onerror = () => {
      setTimeout(() => {
        eventSource.close();
        setIsArbitrating(false);
        queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
        queryClient.invalidateQueries({ queryKey: ['dispute-record', id] });
        refetchDispute();
      }, 5000);
    };
  };

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (isEscrowLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  /* ── Pipeline node helpers ─────────────────────────────────────────────── */
  const isBuyerCompleted     = hasResult || buyerStep     === 'completed';
  const isSellerCompleted    = hasResult || sellerStep    === 'completed';
  const isArbitratorCompleted= hasResult || arbitratorStep=== 'completed';
  const isFsmCompleted       = hasResult || fsmStep       === 'completed';

  const nodeStyle = (isCompleted, isProcessing) =>
    isCompleted
      ? 'border-[#10B981] bg-[#10B981]/5 text-text-primary shadow-sm'
      : isProcessing
      ? 'border-[#8B5CF6] bg-white/85 text-text-primary shadow-[0_0_15px_rgba(139,92,246,0.35)] animate-pulse'
      : 'border-white/70 text-text-muted bg-white/30';

  const iconStyle = (isCompleted, isProcessing, colourClass) =>
    isCompleted
      ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
      : isProcessing
      ? `${colourClass} animate-pulse scale-105`
      : colourClass.replace('/20', '/10').replace('/30', '/20');

  const arrowClass = (isProcessing) =>
    isProcessing ? 'text-[#8B5CF6] animate-pulse' : 'text-text-muted/50';

  const getPipelineStatus = () => {
    if (!isArbitrating && !hasResult) return 'Arbitration pipeline ready.';
    if (buyerStep     === 'processing') return "Analyzing Buyer's Evidence...";
    if (sellerStep    === 'processing') return "Analyzing Seller's Evidence...";
    if (arbitratorStep=== 'processing') return 'Evaluating arguments & deciding verdict...';
    if (fsmStep       === 'processing') return 'Validating confidence & executing FSM...';
    if (hasResult)  return 'Arbitration complete. All agents responded.';
    return 'Running Spring FSM confidence checks...';
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes tzBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      <div className="space-y-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center space-x-4">
          <Link
            to={`/escrows/${id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 border border-white/80 text-text-secondary hover:text-text-primary shadow-xs hover:border-white transition-all"
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

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Left: Flow + Live Panels ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Pipeline flowchart ──────────────────────────────────────── */}
            <div className="glass-panel p-6 relative overflow-hidden bg-white/40 border-white/60 shadow-sm">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-28 w-28 rounded-full bg-[#8B5CF6]/10 blur-2xl pointer-events-none" />

              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center space-x-1.5">
                <Cpu className="h-4 w-4 text-[#8B5CF6]" />
                <span>Multi-Agent Arbitration Flow</span>
              </h3>

              <div className="flex flex-col md:flex-row md:items-center justify-around gap-4 relative">
                {/* Buyer node */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`flex flex-col items-center p-4 rounded-2xl border text-center max-w-[120px] transition-all ${nodeStyle(isBuyerCompleted, buyerStep === 'processing')}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${iconStyle(isBuyerCompleted, buyerStep === 'processing', 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30')}`}>
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">Buyer Advocate</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1">Argues Refund</span>
                </motion.div>

                <ChevronRight className={`hidden md:block h-5 w-5 transition-all ${arrowClass(buyerStep === 'processing')}`} />

                {/* Seller node */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`flex flex-col items-center p-4 rounded-2xl border text-center max-w-[120px] transition-all ${nodeStyle(isSellerCompleted, sellerStep === 'processing')}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${iconStyle(isSellerCompleted, sellerStep === 'processing', 'bg-[#FF7EB6]/20 text-[#FF7EB6] border border-[#FF7EB6]/30')}`}>
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">Seller Advocate</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1">Argues Release</span>
                </motion.div>

                <ChevronRight className={`hidden md:block h-5 w-5 transition-all ${arrowClass(sellerStep === 'processing')}`} />

                {/* Arbitrator node */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`flex flex-col items-center p-4 rounded-2xl border text-center max-w-[120px] transition-all ${nodeStyle(isArbitratorCompleted, arbitratorStep === 'processing')}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${iconStyle(isArbitratorCompleted, arbitratorStep === 'processing', 'bg-[#FFC371]/15 text-[#D97706] border border-[#FFC371]/25')}`}>
                    <Gavel className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">Neutral Arbitrator</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1">Decides Verdict</span>
                </motion.div>

                <ChevronRight className={`hidden md:block h-5 w-5 transition-all ${arrowClass(arbitratorStep === 'processing')}`} />

                {/* FSM / Confidence node */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`flex flex-col items-center p-4 rounded-2xl border text-center max-w-[120px] transition-all ${nodeStyle(isFsmCompleted, fsmStep === 'processing')}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${iconStyle(isFsmCompleted, fsmStep === 'processing', 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20')}`}>
                    <Award className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">Confidence Check</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-1">Spring FSM</span>
                </motion.div>
              </div>

              {/* ── Trigger / Status bar ────────────────────────────────────── */}
              <div className="border-t border-white/60 pt-5 mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Status */}
                <div className="flex items-center space-x-3 text-xs">
                  <div className={`rounded-xl p-2 border ${
                    isArbitrating
                      ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#8B5CF6] animate-pulse'
                      : hasResult
                      ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                      : 'bg-[#FFC371]/15 border-[#FFC371]/30 text-[#D97706] animate-pulse'
                  }`}>
                    {isArbitrating ? <Radio className="h-4 w-4" /> : hasResult ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">
                      {isArbitrating ? 'Live AI Arbitration Running' : hasResult ? 'Arbitration Complete' : 'Awaiting Arbitration'}
                    </p>
                    <p className="text-text-secondary mt-0.5 font-medium">{getPipelineStatus()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* "View results" toggle if panel is hidden */}
                  {hasResult && !showLivePanel && (
                    <button
                      onClick={() => setShowLivePanel(true)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-all cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Arbitration Results</span>
                    </button>
                  )}

                  {/* Admin trigger */}
                  {!hasResult && isAdmin && (
                    <button
                      onClick={triggerArbitrationStream}
                      disabled={isArbitrating}
                      className="btn-primary flex items-center space-x-2 px-5 py-2.5 text-sm font-bold shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isArbitrating ? (
                        <><Loader className="h-4 w-4 animate-spin" /><span>Arbitration in Progress...</span></>
                      ) : (
                        <><Zap className="h-4 w-4" /><span>Trigger AI Arbitration</span></>
                      )}
                    </button>
                  )}

                  {!hasResult && !isAdmin && (
                    <p className="text-[11px] text-[#D97706] bg-[#FFC371]/10 border border-[#FFC371]/35 rounded-xl p-2.5 max-w-xs font-medium leading-relaxed">
                      Contact an Administrator to trigger AI arbitration on this contract.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Live Arbitration Viewer ─────────────────────────────────── */}
            <AnimatePresence>
              {showLivePanel && (
                <motion.div
                  key="live-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Panel header bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isArbitrating ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-full px-3 py-1 uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-ping" />
                          Live Stream
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 rounded-full px-3 py-1 uppercase tracking-wider">
                          <CheckCircle className="h-3 w-3" />
                          Arbitration Complete
                        </span>
                      )}
                      <span className="text-[11px] text-text-muted font-semibold">Agent Responses</span>
                    </div>
                    {/* Collapse */}
                    {!isArbitrating && (
                      <button
                        onClick={() => setShowLivePanel(false)}
                        className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary font-semibold cursor-pointer transition-colors"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Collapse
                      </button>
                    )}
                  </div>

                  {/* ── Parallel Advocate Banner ─────────────────────────── */}
                  {(buyerStep === 'processing' || sellerStep === 'processing') &&
                    arbitratorStep === 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 py-2"
                    >
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent" />
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6] bg-[#8B5CF6]/8 border border-[#8B5CF6]/25 rounded-full px-3 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-ping" />
                        Advocates Running in Parallel
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF7EB6] animate-ping" />
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF7EB6]/30 to-transparent" />
                    </motion.div>
                  )}

                  {/* ── Buyer + Seller panels — side-by-side with VS divider ── */}
                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                    {/* Buyer */}
                    <div className="md:pr-6">
                      <AgentPanel
                        label="Agent 1: Buyer Advocate"
                        sublabel="Argues Refund"
                        icon={BrainCircuit}
                        borderClass={
                          buyerStep === 'processing'
                            ? 'border-[#8B5CF6]/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                            : buyerArgText
                            ? 'border-[#10B981]/30'
                            : 'border-white/60'
                        }
                        headerClass={
                          buyerStep === 'processing'
                            ? 'bg-[#8B5CF6]/8 text-[#8B5CF6]'
                            : buyerArgText
                            ? 'bg-[#10B981]/5 text-[#10B981]'
                            : 'bg-white/20 text-text-muted'
                        }
                        agentStep={buyerStep}
                        text={buyerArgText}
                        animate={!!liveByuerArg && !dbBuyerArg}
                      />
                    </div>

                    {/* VS Divider */}
                    <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-center pointer-events-none z-10">
                      <div className="flex-1 w-px bg-gradient-to-b from-transparent via-text-muted/20 to-transparent" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-white/90 shadow-sm text-[10px] font-black text-text-muted select-none">
                        VS
                      </div>
                      <div className="flex-1 w-px bg-gradient-to-b from-transparent via-text-muted/20 to-transparent" />
                    </div>

                    {/* Seller */}
                    <div className="md:pl-6 mt-4 md:mt-0">
                      <AgentPanel
                        label="Agent 2: Seller Advocate"
                        sublabel="Argues Release"
                        icon={BrainCircuit}
                        borderClass={
                          sellerStep === 'processing'
                            ? 'border-[#FF7EB6]/50 shadow-[0_0_20px_rgba(255,126,182,0.15)]'
                            : sellerArgText
                            ? 'border-[#10B981]/30'
                            : 'border-white/60'
                        }
                        headerClass={
                          sellerStep === 'processing'
                            ? 'bg-[#FF7EB6]/8 text-[#FF7EB6]'
                            : sellerArgText
                            ? 'bg-[#10B981]/5 text-[#10B981]'
                            : 'bg-white/20 text-text-muted'
                        }
                        agentStep={sellerStep}
                        text={sellerArgText}
                        animate={!!liveSellerArg && !dbSellerArg}
                      />
                    </div>
                  </div>

                  {/* ── Arbitrator awaiting banner ────────────────────────── */}
                  {(buyerStep === 'processing' || sellerStep === 'processing') &&
                    arbitratorStep === 'idle' && (
                    <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted font-semibold py-1">
                      <Clock className="h-3 w-3 animate-pulse" />
                      <span>Neutral Arbitrator is waiting for both advocates to complete...</span>
                    </div>
                  )}

                  {/* ── Arbitrator panel (full width like HTML) ────────────── */}
                  <AgentPanel
                    label="Agent 3: Neutral Arbitrator"
                    sublabel="Decides Final Verdict"
                    icon={Gavel}
                    borderClass={
                      arbitratorStep === 'processing'
                        ? 'border-[#FFC371]/50 shadow-[0_0_20px_rgba(255,195,113,0.15)]'
                        : reasoningText
                        ? 'border-[#10B981]/30'
                        : 'border-white/60'
                    }
                    headerClass={
                      arbitratorStep === 'processing'
                        ? 'bg-[#FFC371]/8 text-[#D97706]'
                        : reasoningText
                        ? 'bg-[#10B981]/5 text-[#10B981]'
                        : 'bg-white/20 text-text-muted'
                    }
                    agentStep={arbitratorStep}
                    text={reasoningText}
                    animate={!!liveReasoning && !dbReasoning}
                  />


                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Re-open button when panel collapsed ─────────────────────── */}
            {hasResult && !showLivePanel && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowLivePanel(true)}
                className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/8 text-[#8B5CF6] text-xs font-bold hover:bg-[#8B5CF6]/15 transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                <span>View AI Arbitration Results</span>
                <Sparkles className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>

          {/* ── Right: Confidence Engine + Evidence Context ───────────────── */}
          <div className="space-y-6">

            {/* Java Confidence Engine */}
            {hasResult && (
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

                {/* Circle */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 bg-white/40 shadow-sm">
                    <span className={`absolute inset-0 rounded-full blur-sm opacity-25 ${aiConfidence >= 0.75 ? 'bg-[#10B981]' : 'bg-[#FFC371]'}`} />
                    <span className={`text-2xl font-black ${aiConfidence >= 0.75 ? 'text-[#10B981]' : 'text-[#D97706]'}`}>
                      {(aiConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-primary mt-3">Confidence Rating</p>
                  <p className="text-[10px] text-text-muted mt-0.5 font-semibold">Threshold for Auto-Execution: 75%</p>
                </div>

                {/* Status card */}
                <div className={`rounded-2xl border p-4 text-xs ${autoExecuted ? 'bg-[#10B981]/5 border-[#10B981]/20 text-[#065F46]' : 'bg-[#FFC371]/10 border-[#FFC371]/30 text-[#92400E]'}`}>
                  <p className="font-bold flex items-center space-x-1.5">
                    {autoExecuted ? <><CheckCircle className="h-4 w-4" /><span>Resolution: Auto-Executed</span></> : <><AlertTriangle className="h-4 w-4" /><span>Resolution: Escalated to Admin</span></>}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed font-semibold">
                    {autoExecuted
                      ? 'Confidence exceeded threshold. The net locked amount has been automatically distributed via Spring FSM.'
                      : 'Confidence level fell below threshold. The verdict has been flagged for human admin override.'}
                  </p>
                </div>

                {/* Verdict */}
                <div className="space-y-2.5 text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-4">
                  <p className="font-bold text-text-muted text-[9px] tracking-widest">Final AI Verdict</p>
                  <div className={`p-3 rounded-xl border ${aiVerdict === 'RELEASE' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#059669]' : aiVerdict === 'REFUND' ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-[#8B5CF6]' : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#D97706]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{aiVerdict || 'PENDING'}</span>
                      <Gavel className="w-4 h-4 opacity-70" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Evidence Context */}
            <div className="glass-panel p-6 shadow-sm space-y-4 bg-white/40 border-white/60">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center space-x-1.5 pb-2 border-b border-white/60">
                <Activity className="h-4 w-4 text-[#8B5CF6]" />
                <span>Evidence Context</span>
              </h3>
              <div className="space-y-3.5 text-xs text-text-secondary font-medium">
                <div>
                  <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Agreed Terms</span>
                  <span className="font-bold text-text-primary mt-0.5 block">
                    {disputeRecord?.agreedDeliveryTerms || 'Standard work deliverables.'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Delivery Proof URL</span>
                  <span className="font-semibold text-text-primary break-all block mt-0.5">
                    {disputeRecord?.buyerEvidenceUrl || disputeRecord?.sellerEvidenceUrl || 'No proof URL uploaded.'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/40 pt-2.5">
                  <span>Proof Submitted (DB)</span>
                  <span className={`font-black ${disputeRecord?.buyerEvidenceUrl || disputeRecord?.sellerEvidenceUrl ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {disputeRecord?.buyerEvidenceUrl || disputeRecord?.sellerEvidenceUrl ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline Met (DB)</span>
                  <span className="font-black text-[#10B981]">TRUE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DisputeDetails;
