import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import auditService from '../../services/audit.service';
import disputeService from '../../services/dispute.service';
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
  Hammer,
  Upload,
  Plus
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
  const [showSellerResponseModal, setShowSellerResponseModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerResolve, handleSubmit: handleSubmitResolve, reset: resetResolve } = useForm();
  const { register: registerSeller, handleSubmit: handleSubmitSeller, reset: resetSeller } = useForm();

  // 1. Fetch Escrow Details
  const { data: escrow, isLoading, isError } = useQuery({
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

  // Query Escrow Evidence records from backend
  const { data: evidenceList = [], refetch: refetchEvidence } = useQuery({
    queryKey: ['evidence-list', id],
    queryFn: () => disputeService.getEvidenceForEscrow(id),
    enabled: !!id
  });

  // Fetch Dispute Record details from database
  const { data: disputeRecord } = useQuery({
    queryKey: ['dispute-record', id],
    queryFn: () => escrowService.getDisputeRecord(id),
    enabled: !!id && (escrow?.status === 'DISPUTED' || escrow?.status === 'RELEASED' || escrow?.status === 'REFUNDED'),
    retry: false
  });

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofDescription, setProofDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Please select a proof file (image or video) to upload.");
      return;
    }
    if (!proofDescription.trim()) {
      toast.error("Description is required to explain the context of your evidence.");
      return;
    }

    setUploadLoading(true);
    const isBuyer = escrow?.buyerName === currentUser?.name;
    const isSeller = escrow?.sellerName === currentUser?.name;
    const party = isBuyer ? 'BUYER' : isSeller ? 'SELLER' : 'BUYER';

    toast.promise(
      disputeService.uploadEvidence(id, proofFile, party, proofDescription),
      {
        loading: 'Uploading evidence & running VLM analyzer...',
        success: (data) => {
          refetchEvidence();
          setUploadLoading(false);
          setShowProofModal(false);
          setProofFile(null);
          setProofDescription('');
          return `Evidence uploaded successfully!`;
        },
        error: (err) => {
          setUploadLoading(false);
          return err.response?.data?.message || 'Failed to upload evidence.';
        }
      }
    );
  };

  const [selectedImage, setSelectedImage] = useState(null);

  // 3. Fund Escrow Mutation
  const fundMutation = useMutation({
    mutationFn: () => escrowService.fundEscrow(userEmail, id),
    onSuccess: () => {
      toast.success('Escrow funded successfully! Funds are now locked.');
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      queryClient.invalidateQueries({ queryKey: ['escrow-history', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
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
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
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
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
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
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute.');
    }
  });

  // 7. Submit Seller Response Mutation
  const sellerResponseMutation = useMutation({
    mutationFn: (data) => escrowService.submitSellerResponse(userEmail, id, data),
    onSuccess: () => {
      toast.success('Dispute response submitted successfully!');
      setShowSellerResponseModal(false);
      resetSeller();
      queryClient.invalidateQueries({ queryKey: ['escrow', id, userEmail] });
      queryClient.invalidateQueries({ queryKey: ['escrow-history', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit response.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !escrow) {
    return (
      <div className="text-center py-20 rounded-2xl glass-panel text-text-muted bg-white/40">
        <AlertTriangle className="h-12 w-12 text-[#EF4444] mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Failed to load Escrow contract</h3>
        <p className="text-sm mt-1 mb-4">The agreement may not exist or you lack authorization to inspect it.</p>
        <Link to="/escrows" className="inline-flex items-center space-x-2 text-[#8B5CF6] hover:underline font-semibold">
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 border border-white/80 text-text-secondary hover:text-text-primary shadow-xs hover:border-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2">
              <Scroll className="h-6 w-6 text-[#8B5CF6]" />
              <span>{escrow.title}</span>
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Escrow ID: {escrow.id} • Created on {new Date(escrow.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Top Status Indicator */}
        <span className={`inline-flex rounded-full px-4.5 py-1 text-xs font-bold border uppercase tracking-wider ${
          escrow.status === 'RELEASED' ? 'bg-[#10B981]/15 text-[#059669] border-[#10B981]/30' :
          escrow.status === 'FUNDED' ? 'bg-[#60A5FA]/15 text-[#2563EB] border-[#60A5FA]/30' :
          escrow.status === 'DISPUTED' ? 'bg-[#EF4444]/15 text-[#DC2626] border-[#EF4444]/30' :
          escrow.status === 'REFUNDED' ? 'bg-[#FFC371]/25 text-[#D97706] border-[#FFC371]/40' :
          'bg-text-muted/15 text-text-muted border-white/60'
        }`}>
          {escrow.status}
        </span>
      </div>

      {/* Progress Timeline Tracker */}
      <div className="glass-panel p-6 shadow-sm bg-white/40 border-white/60">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">Contract Execution Progress</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0">
          {steps.map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex items-center space-x-3.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                  idx <= currentStepIndex
                    ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/10'
                    : 'border-white/80 text-text-muted bg-white/20'
                }`}>
                  {idx < currentStepIndex ? <CheckCircle className="h-5.5 w-5.5" /> : idx + 1}
                </div>
                <div>
                  <p className={`text-sm font-bold ${idx <= currentStepIndex ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {step}
                  </p>
                  <p className="text-[10px] text-text-muted font-medium">
                    {idx === currentStepIndex ? 'Active Phase' : idx < currentStepIndex ? 'Completed' : 'Upcoming'}
                  </p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`hidden md:block h-[2px] flex-1 mx-4 transition-all duration-500 ${
                  idx < currentStepIndex ? 'bg-[#8B5CF6]' : 'bg-white/60'
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
          <div className="glass-panel p-7 space-y-6 shadow-sm bg-white/40 border-white/60">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Description & Deliverables</h3>
              <p className="text-sm text-text-secondary leading-relaxed bg-white/30 rounded-2xl p-4.5 border border-white/60 font-medium">
                {escrow.description}
              </p>
            </div>

            {/* Financial Details Row */}
            <div className="grid gap-4 sm:grid-cols-3 border-t border-white/60 pt-6">
              <div>
                <span className="text-xs text-text-secondary font-medium block">Total Value</span>
                <span className="text-xl font-bold text-text-primary">₹{Number(escrow.amount).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-medium block">Commission (3%)</span>
                <span className="text-xl font-bold text-[#D97706]">₹{Number(escrow.platformFee || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-text-secondary font-medium block">Locked Net Guarantee</span>
                <span className="text-xl font-bold text-[#10B981]">₹{Number(escrow.lockedAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid gap-4 sm:grid-cols-2 border-t border-white/60 pt-6 text-xs text-text-secondary">
              <div className="bg-white/30 rounded-2xl p-4 border border-white/50 shadow-2xs">
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Buyer Participant</span>
                <span className="text-sm font-bold text-text-primary mt-1 block">{escrow.buyerName}</span>
                <span className="text-[10px] text-text-muted font-semibold">Account ID: {escrow.buyerId}</span>
              </div>
              <div className="bg-white/30 rounded-2xl p-4 border border-white/50 shadow-2xs">
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Seller Participant</span>
                <span className="text-sm font-bold text-text-primary mt-1 block">{escrow.sellerName}</span>
                <span className="text-[10px] text-text-muted font-semibold">Account ID: {escrow.sellerId}</span>
              </div>
            </div>

            {/* Dispute Reason section if present */}
            {escrow.disputeReason && (
              <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-5 space-y-2">
                <span className="flex items-center text-xs font-bold text-[#EF4444]">
                  <ShieldAlert className="h-4.5 w-4.5 mr-1.5" />
                  Dispute Resolution Audit Record
                </span>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  {escrow.disputeReason}
                </p>
              </div>
            )}

            {/* Dispute details if present in DB */}
            {disputeRecord && (
              <div className="rounded-2xl border border-white/60 bg-white/30 p-5 space-y-4 shadow-2xs">
                <span className="flex items-center text-xs font-bold text-[#EF4444]">
                  <ShieldAlert className="h-4.5 w-4.5 mr-1.5" />
                  Structured Dispute Case Files
                </span>
                <div className="grid gap-4 sm:grid-cols-2 text-xs font-medium text-text-secondary">
                  <div className="bg-white/40 border border-white/60 rounded-xl p-3">
                    <strong className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Buyer Claim</strong>
                    <p className="font-semibold text-text-primary">{disputeRecord.buyerClaim}</p>
                    <p className="text-[10px] text-text-muted mt-2">Agreed Terms: {disputeRecord.agreedDeliveryTerms}</p>
                    {disputeRecord.buyerEvidenceUrl && (
                      <p className="text-[10px] text-[#8B5CF6] mt-1 font-semibold truncate">
                        Link: <a href={disputeRecord.buyerEvidenceUrl} target="_blank" rel="noreferrer" className="underline">{disputeRecord.buyerEvidenceUrl}</a>
                      </p>
                    )}
                  </div>
                  <div className="bg-white/40 border border-white/60 rounded-xl p-3">
                    <strong className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Seller Defense</strong>
                    <p className="font-semibold text-text-primary">{disputeRecord.sellerResponse || 'Awaiting formal response from the Seller...'}</p>
                    {disputeRecord.sellerEvidenceUrl && (
                      <p className="text-[10px] text-[#FF7EB6] mt-2 font-semibold truncate">
                        Link: <a href={disputeRecord.sellerEvidenceUrl} target="_blank" rel="noreferrer" className="underline">{disputeRecord.sellerEvidenceUrl}</a>
                      </p>
                    )}
                  </div>
                </div>

                {disputeRecord.aiRecommendedVerdict && (
                  <div className="bg-white/40 border border-white/60 rounded-xl p-4.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[10px] text-[#D97706] uppercase tracking-wider">AI Recommended Verdict</strong>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${disputeRecord.autoExecuted ? 'bg-[#10B981]/15 text-[#059669]' : 'bg-[#FFC371]/15 text-[#D97706]'}`}>
                        {disputeRecord.autoExecuted ? 'Auto-Executed' : 'Requires Override'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-text-primary text-gradient">
                      {disputeRecord.aiRecommendedVerdict === 'RELEASE' ? 'Release funds to Seller' : 'Refund funds to Buyer'} (Confidence: {(disputeRecord.aiConfidenceScore * 100).toFixed(0)}%)
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                      Reasoning: {disputeRecord.aiReasoning}
                    </p>
                  </div>
                )}
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
                className="btn-primary flex items-center space-x-2 px-6 py-3.5 text-sm font-semibold cursor-pointer shadow-sm disabled:opacity-50"
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
                    className="flex items-center space-x-2 rounded-full bg-[#10B981] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#10B981]/20 hover:bg-[#059669] hover:translate-y-[-2px] transition-all duration-300 cursor-pointer disabled:opacity-50"
                  >
                    {releaseMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>Release Funds to Seller</span>
                  </button>
                )}

                {(isBuyer || isSeller) && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="flex items-center space-x-2 rounded-full bg-[#EF4444] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#EF4444]/20 hover:bg-[#DC2626] hover:translate-y-[-2px] transition-all duration-300 cursor-pointer"
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
                    className="btn-primary flex items-center space-x-2 px-6 py-3.5 text-sm font-semibold cursor-pointer shadow-sm"
                  >
                    <Hammer className="h-4 w-4" />
                    <span>Open AI Arbitration Hub</span>
                  </Link>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="btn-secondary px-6 py-3.5 text-sm font-semibold cursor-pointer"
                  >
                    <span>Resolve Manually</span>
                  </button>
                )}

                {isSeller && !escrow.sellerResponse && (
                  <button
                    onClick={() => setShowSellerResponseModal(true)}
                    className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white px-6 py-3.5 text-sm font-bold shadow-md hover:translate-y-[-2px] transition-all duration-300 cursor-pointer"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Respond to Dispute</span>
                  </button>
                )}

                {!isAdmin && (
                  <Link
                    to={`/disputes/${escrow.id}`}
                    className="btn-primary px-6 py-3.5 text-sm font-semibold cursor-pointer shadow-sm"
                  >
                    <span>View Live Arbitration Verdict</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column (Audit Timeline logs) */}
        <div className="space-y-6">
          <div className="glass-panel p-7 flex flex-col justify-between h-fit shadow-sm bg-white/40 border-white/60">
            <div>
              <h3 className="text-base font-bold text-text-primary mb-6 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#8B5CF6]" />
                <span>Contract History Timeline</span>
              </h3>

              {!auditLogs || auditLogs.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-xs">
                  <p>No audit timeline logs registered for this escrow.</p>
                </div>
              ) : (
                <div className="relative border-l border-white/80 pl-5 space-y-6 text-xs text-text-secondary">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Circle marker */}
                      <span className="absolute -left-[25px] top-1.5 flex h-2 w-2 rounded-full bg-[#8B5CF6] shadow-sm"></span>
                      <p className="font-bold text-text-primary">{log.action}</p>
                      <p className="text-[9px] text-text-muted mt-0.5 uppercase tracking-wider font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-1 text-text-secondary leading-relaxed font-semibold">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visual Evidence (VLM Analyzer) Panel */}
          <div className="glass-panel p-7 h-fit shadow-sm bg-white/40 border-white/60 space-y-6">
            <h3 className="text-base font-bold text-text-primary flex items-center space-x-2 pb-4 border-b border-white/60">
              <ShieldCheck className="h-5 w-5 text-[#10B981]" />
              <span>Visual Evidence (VLM Analyzer)</span>
            </h3>

            {/* Upload Button */}
            {(isBuyer || isSeller) && (escrow.status === 'FUNDED' || escrow.status === 'DISPUTED') && (
              <button
                onClick={() => setShowProofModal(true)}
                className="w-full btn-primary flex items-center justify-center space-x-2 px-5 py-3 text-sm font-semibold cursor-pointer shadow-md"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add Proof</span>
              </button>
            )}

            {/* Evidence List */}
            {evidenceList.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-xs bg-white/20 rounded-2xl p-4 border border-white/60">
                <p className="font-semibold">No proof has been uploaded yet. Click "Add Proof" to submit evidence.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="border border-white/60 bg-white/30 rounded-2xl p-3.5 text-xs space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      <span className={ev.party === 'BUYER' ? 'text-[#8B5CF6]' : 'text-[#FF7EB6]'}>
                        Uploaded By: {ev.party}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full ${ev.analysisStatus === 'ANALYZED' ? 'bg-[#10B981]/15 text-[#059669] border border-[#10B981]/20' : 'bg-[#EF4444]/15 text-[#DC2626] border border-[#EF4444]/20'}`}>
                        {ev.analysisStatus}
                      </span>
                    </div>
                    
                    {/* File Preview */}
                    {ev.fileType && ev.fileType.startsWith('video/') ? (
                      <div className="relative overflow-hidden rounded-xl border border-white/50 bg-black/10">
                        <video 
                          src={ev.fileUrl} 
                          controls
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setSelectedImage(ev)} 
                        className="cursor-zoom-in group relative overflow-hidden rounded-xl border border-white/50"
                      >
                        <img 
                          src={ev.fileUrl} 
                          alt={ev.fileName} 
                          className="w-full h-32 object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                          <span className="text-[10px] text-white font-bold bg-black/40 rounded-full px-3 py-1 backdrop-blur-xs">Click to Zoom</span>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-text-secondary leading-relaxed bg-white/50 p-2.5 rounded-xl border border-white/60 font-semibold">
                      <strong>Description:</strong> {ev.description || "No context description provided."}
                    </p>
                    
                    <p className="text-[10px] text-text-secondary font-semibold leading-relaxed bg-white/40 p-2.5 rounded-xl border border-white/60">
                      <strong>VLM Summary:</strong> {ev.vlmAnalysis}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-text-muted font-bold uppercase tracking-wider border-t border-white/40 pt-2">
                      <span>{new Date(ev.uploadedAt).toLocaleString()}</span>
                      <button 
                        onClick={() => toast.error("Audit log locking: evidence cannot be deleted once analyzed by the VLM.")}
                        className="text-danger hover:underline font-bold bg-transparent border-none cursor-pointer text-[9px]"
                      >
                        Delete
                      </button>
                    </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[28px] glass-panel p-7 shadow-2xl space-y-4 bg-white/80 border-white"
            >
              <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
                <span>File Structured Dispute Claim</span>
              </h3>
              <p className="text-xs text-text-secondary font-medium leading-relaxed">
                Submit this dispute claim to freeze the contract. Our three-agent AI arbitration pipeline will automatically review statements and delivery logs.
              </p>

              <form onSubmit={handleSubmit((data) => disputeMutation.mutate(data))} className="space-y-4 text-sm text-text-secondary">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Buyer Claim / Issue Statement</label>
                  <textarea
                    rows={3}
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="Describe exactly what went wrong or why you want a refund..."
                    {...register('buyerClaim', { required: true })}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Agreed Delivery Terms</label>
                  <input
                    type="text"
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="e.g., Deliver website source files by July 15"
                    {...register('agreedDeliveryTerms', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Evidence URL / Delivery Proof</label>
                  <input
                    type="text"
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="e.g., URL to github commit or hosted demo site"
                    {...register('evidenceUrl')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <label className="flex items-center space-x-2 bg-white/40 border border-white/60 rounded-xl p-2.5 cursor-pointer shadow-2xs">
                    <input type="checkbox" {...register('deliveryProofSubmitted')} className="rounded accent-[#8B5CF6]" />
                    <span>Proof Submitted</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-white/40 border border-white/60 rounded-xl p-2.5 cursor-pointer shadow-2xs">
                    <input type="checkbox" {...register('deadlineMet')} className="rounded accent-[#8B5CF6]" />
                    <span>Deadline Met</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeMutation.isPending}
                    className="flex items-center space-x-1.5 rounded-full bg-[#EF4444] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#DC2626] cursor-pointer disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[28px] glass-panel p-7 shadow-2xl space-y-4 bg-white/80 border-white"
            >
              <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <Hammer className="h-5 w-5 text-[#8B5CF6]" />
                <span>Manual Admin Resolution Override</span>
              </h3>

              <form onSubmit={handleSubmitResolve((data) => resolveMutation.mutate(data))} className="space-y-4 text-sm text-text-secondary">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Resolution Outcome</label>
                  <select
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all cursor-pointer"
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
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="Document the human administrator audit notes here..."
                    {...registerResolve('adminNotes', { required: true })}
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resolveMutation.isPending}
                    className="btn-primary px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {resolveMutation.isPending ? 'Processing...' : 'Confirm Resolution'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SELLER RESPONSE MODAL */}
      <AnimatePresence>
        {showSellerResponseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#13111C] border border-gray-200 dark:border-white/10 p-7 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-[#8B5CF6]" />
                <span>Submit Dispute Defense & Response</span>
              </h3>
              <p className="text-xs text-text-secondary font-medium leading-relaxed">
                Provide your statement defending your performance or delivery of the terms. This log will be ingested by the AI agents during arbitration.
              </p>

              <form onSubmit={handleSubmitSeller((data) => sellerResponseMutation.mutate(data))} className="space-y-4 text-sm text-text-secondary">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Seller Response Statement</label>
                  <textarea
                    rows={3}
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="Provide detailed defense statements, stating why you are entitled to the release of escrow funds..."
                    {...registerSeller('sellerResponse', { required: true, minLength: 10 })}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Seller Evidence URL / Delivery Proof URL (Optional)</label>
                  <input
                    type="text"
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="e.g., URL to github repository, shared Google Drive, or transaction proof"
                    {...registerSeller('sellerEvidenceUrl')}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSellerResponseModal(false)}
                    className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sellerResponseMutation.isPending}
                    className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white px-5 py-2 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {sellerResponseMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Submit Response</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROOF UPLOAD MODAL */}
      <AnimatePresence>
        {showProofModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[28px] glass-panel p-7 shadow-2xl space-y-4 bg-white/80 border-white"
            >
              <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-[#8B5CF6]" />
                <span>Submit Visual Evidence</span>
              </h3>

              <form onSubmit={handleSubmitProof} className="space-y-4 text-sm text-text-secondary">
                {/* File input */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Upload Screen/Proof File (Image or Video)
                  </label>
                  <div className="flex items-center justify-center border-2 border-dashed border-white/90 rounded-2xl p-4 bg-white/20 hover:bg-white/30 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      required
                    />
                    <div className="text-center text-xs text-text-secondary font-semibold">
                      {proofFile ? (
                        <span className="text-[#8B5CF6] font-bold block truncate max-w-[250px]">
                          Selected: {proofFile.name}
                        </span>
                      ) : (
                        <span>Click to select screenshot or video file</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Proof Context / Description (Required)
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full glass-input p-3 text-xs focus:outline-none transition-all"
                    placeholder="Provide a detailed description of what this proof represents..."
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProofModal(false);
                      setProofFile(null);
                      setProofDescription('');
                    }}
                    className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#FF7EB6] text-white px-5 py-2 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {uploadLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>Upload & Analyze</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white/10 p-2 border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage.fileUrl} 
                alt={selectedImage.fileName} 
                className="max-w-full max-h-[80vh] rounded-xl object-contain"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-xs text-white text-xs font-semibold p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
                <span>{selectedImage.fileName} ({selectedImage.party} Evidence)</span>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-2.5 py-1 transition-all cursor-pointer font-bold border-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EscrowDetails;
