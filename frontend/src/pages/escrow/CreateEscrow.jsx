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
        <p className="mt-1 text-sm text-text-secondary">
          Initiate a secure financial agreement between buyer and seller with automated AI dispute arbitration logic.
        </p>
      </div>

      {/* Main Form Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-panel p-8 shadow-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Contract Title
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FileText className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="text"
                className={`block w-full rounded-lg border bg-bg-dark/50 py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                  errors.title ? 'border-danger focus:ring-danger' : 'border-border-dark'
                }`}
                placeholder="e.g., Software Consulting Deliverables"
                {...register('title', { required: 'Contract title is required' })}
              />
            </div>
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Deliverables & Terms Description
            </label>
            <textarea
              rows={4}
              className={`block w-full rounded-lg border bg-bg-dark/50 py-2.5 px-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                errors.description ? 'border-danger focus:ring-danger' : 'border-border-dark'
              }`}
              placeholder="Detail the scope of work, code repositories, asset files, and verification criteria for AI/human advocates to inspect if a dispute is raised..."
              {...register('description', { required: 'Description is required' })}
            ></textarea>
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
          </div>

          {/* Seller ID and Amount Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Seller ID Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Seller Account ID (User ID)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserPlus className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="number"
                  className={`block w-full rounded-lg border bg-bg-dark/50 py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                    errors.sellerId ? 'border-danger focus:ring-danger' : 'border-border-dark'
                  }`}
                  placeholder="2"
                  {...register('sellerId', {
                    required: 'Seller ID is required',
                    min: { value: 1, message: 'Invalid ID' }
                  })}
                />
              </div>
              {errors.sellerId && <p className="mt-1 text-xs text-danger">{errors.sellerId.message}</p>}
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Contract Amount (USD)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  className={`block w-full rounded-lg border bg-bg-dark/50 py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                    errors.amount ? 'border-danger focus:ring-danger' : 'border-border-dark'
                  }`}
                  placeholder="500.00"
                  {...register('amount', {
                    required: 'Contract amount is required',
                    min: { value: 1, message: 'Minimum contract is $1.00' }
                  })}
                />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Commission Breakdown Panel */}
          {Number(amountWatch) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-border-dark bg-card-dark/40 p-4 space-y-2 text-xs"
            >
              <div className="flex justify-between text-text-secondary">
                <span>Contract Value</span>
                <span>${Number(amountWatch).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span className="flex items-center">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Platform Commission (3%)
                </span>
                <span>-${commission}</span>
              </div>
              <div className="h-[1px] bg-border-dark my-2"></div>
              <div className="flex justify-between font-bold text-text-primary text-sm">
                <span className="flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1 text-success" />
                  Locked in Escrow (to Release/Refund)
                </span>
                <span>${lockedAmount}</span>
              </div>
            </motion.div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary py-3 text-sm font-semibold text-text-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-primary border-t-transparent"></div>
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
