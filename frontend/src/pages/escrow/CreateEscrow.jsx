import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import { FilePlus2, UserPlus, DollarSign, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const CreateEscrow = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      amount: '',
      sellerId: ''
    }
  });

  const amountWatch = watch('amount') || 0;
  const commission = (Number(amountWatch) * 0.03).toFixed(2);
  const lockedAmount = (Number(amountWatch) - Number(commission)).toFixed(2);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await escrowService.createEscrow(userEmail, data);
      toast.success('Escrow contract created successfully!');
      navigate(`/escrows/${result.id}`);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Failed to create escrow contract.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
          Create Escrow Contract
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Initiate a secure financial agreement between buyer and seller with automated AI dispute arbitration logic.
        </p>
      </div>

      {/* Main Form Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-8 shadow-xl bg-white/40 border-white/60"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Contract Title
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <FileText className="h-4.5 w-4.5 text-text-muted" />
              </div>
              <input
                type="text"
                className={`block w-full glass-input py-3 pl-11 pr-3 transition-all ${
                  errors.title ? 'border-danger focus:ring-danger' : 'border-white/80'
                }`}
                placeholder="e.g., Software Consulting Deliverables"
                {...register('title', { required: 'Contract title is required' })}
              />
            </div>
            {errors.title && <p className="mt-1.5 text-xs text-danger font-medium">{errors.title.message}</p>}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Deliverables & Terms Description
            </label>
            <textarea
              rows={4}
              className={`block w-full glass-input py-3 px-4 transition-all ${
                errors.description ? 'border-danger focus:ring-danger' : 'border-white/80'
              }`}
              placeholder="Detail the scope of work, code repositories, asset files, and verification criteria for AI/human advocates to inspect if a dispute is raised..."
              {...register('description', { required: 'Description is required' })}
            ></textarea>
            {errors.description && <p className="mt-1.5 text-xs text-danger font-medium">{errors.description.message}</p>}
          </div>

          {/* Seller ID and Amount Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Seller ID Field */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Seller Account ID (User ID)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserPlus className="h-4.5 w-4.5 text-text-muted" />
                </div>
                <input
                  type="number"
                  className={`block w-full glass-input py-3 pl-11 pr-3 transition-all ${
                    errors.sellerId ? 'border-danger focus:ring-danger' : 'border-white/80'
                  }`}
                  placeholder="2"
                  {...register('sellerId', {
                    required: 'Seller ID is required',
                    min: { value: 1, message: 'Invalid ID' }
                  })}
                />
              </div>
              {errors.sellerId && <p className="mt-1.5 text-xs text-danger font-medium">{errors.sellerId.message}</p>}
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Contract Amount (USD)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <DollarSign className="h-4.5 w-4.5 text-text-muted" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  className={`block w-full glass-input py-3 pl-11 pr-3 transition-all ${
                    errors.amount ? 'border-danger focus:ring-danger' : 'border-white/80'
                  }`}
                  placeholder="500.00"
                  {...register('amount', {
                    required: 'Contract amount is required',
                    min: { value: 1, message: 'Minimum contract is $1.00' }
                  })}
                />
              </div>
              {errors.amount && <p className="mt-1.5 text-xs text-danger font-medium">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Commission Breakdown Panel */}
          {Number(amountWatch) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/60 bg-white/40 p-5 space-y-2.5 text-xs"
            >
              <div className="flex justify-between text-text-secondary font-medium">
                <span>Contract Value</span>
                <span className="font-bold text-text-primary">${Number(amountWatch).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#D97706] font-semibold">
                <span className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-1 text-[#FFC371]" />
                  Platform Commission (3%)
                </span>
                <span>-${commission}</span>
              </div>
              <div className="h-[1px] bg-white/60 my-2"></div>
              <div className="flex justify-between font-bold text-text-primary text-sm">
                <span className="flex items-center">
                  <ShieldCheck className="h-4.5 w-4.5 mr-1 text-[#10B981]" />
                  Locked in Escrow (to Release/Refund)
                </span>
                <span className="text-[#10B981] font-black">${lockedAmount}</span>
              </div>
            </motion.div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-4 text-sm font-semibold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <FilePlus2 className="h-5 w-5" />
                <span>Create Escrow Agreement</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEscrow;
