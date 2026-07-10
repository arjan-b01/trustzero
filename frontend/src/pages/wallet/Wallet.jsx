import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/wallet.service';
import auditService from '../../services/audit.service';
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, CircleDollarSign, Plus, RefreshCw, History } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Wallet = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';
  const queryClient = useQueryClient();
  const [depositLoading, setDepositLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { amount: '' }
  });

  // 1. Fetch Wallet info
  const { data: walletData, isLoading: isWalletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet', userEmail],
    queryFn: () => walletService.getMyWallet(),
    enabled: !!userEmail
  });

  const walletId = walletData?.walletId;

  // 2. Fetch Wallet Audit logs when walletId is available
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['wallet-history', walletId],
    queryFn: () => auditService.getWalletHistory(walletId),
    enabled: !!walletId
  });

  // 3. Deposit mutation
  const depositMutation = useMutation({
    mutationFn: (amount) => walletService.deposit(amount),
    onSuccess: () => {
      toast.success('Funds deposited successfully!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['wallet', userEmail] });
      if (walletId) {
        queryClient.invalidateQueries({ queryKey: ['wallet-history', walletId] });
      }
    },
    onError: (error) => {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Failed to deposit funds.';
      toast.error(errorMsg);
    }
  });

  const onDeposit = async (data) => {
    setDepositLoading(true);
    try {
      await depositMutation.mutateAsync(data.amount);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast.promise(
      Promise.all([refetchWallet(), walletId ? refetchHistory() : Promise.resolve()]),
      {
        loading: 'Syncing wallet...',
        success: 'Wallet sync complete!',
        error: 'Sync failed.'
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Wallet Hub
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Manage your funds, execute secure deposits, and review financial audit trails.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Wallet</span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Balance & Action Box (Left 1 Col) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[28px] bg-gradient-to-br from-[#7B61FF] via-[#A855F7] to-[#FF7EB6] p-7 text-white shadow-xl shadow-[#7B61FF]/15 relative overflow-hidden group hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-105 transition-all duration-500 pointer-events-none">
              <WalletIcon className="h-44 w-44" />
            </div>

            <div className="flex items-center justify-between z-10 relative">
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">Total Available Balance</span>
              <CircleDollarSign className="h-6 w-6 opacity-85" />
            </div>
            <div className="mt-8 z-10 relative">
              <h2 className="text-[40px] font-black tracking-tight leading-none">
                {isWalletLoading ? '...' : `₹${Number(walletData?.balance || 0).toFixed(2)}`}
              </h2>
              <p className="mt-4 text-[10px] uppercase font-bold tracking-widest opacity-75">
                Wallet ID: {isWalletLoading ? '...' : walletId || 'Not assigned'}
              </p>
            </div>
          </motion.div>

          {/* Deposit Form */}
          <div className="glass-panel p-7 shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-5 flex items-center space-x-2">
              <ArrowDownCircle className="h-5 w-5 text-[#8B5CF6]" />
              <span>Deposit Funds</span>
            </h3>

            <form onSubmit={handleSubmit(onDeposit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Amount (INR)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <span className="text-text-muted text-sm font-semibold">₹</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className={`block w-full glass-input py-3.5 pl-9 pr-3 transition-all ${
                      errors.amount ? 'border-danger focus:ring-danger' : 'border-white/80'
                    }`}
                    placeholder="100.00"
                    {...register('amount', {
                      required: 'Deposit amount is required',
                      min: { value: 1, message: 'Minimum deposit is ₹1.00' }
                    })}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1.5 text-xs text-danger font-medium">{errors.amount.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={depositLoading}
                className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {depositLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Plus className="h-4.5 w-4.5" />
                    <span>Deposit Money</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Table (Right 2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-7 flex flex-col shadow-sm">
          <h3 className="text-base font-bold text-text-primary mb-6 flex items-center space-x-2">
            <History className="h-5 w-5 text-[#8B5CF6]" />
            <span>Transaction & Wallet History</span>
          </h3>

          {isHistoryLoading ? (
            <div className="flex flex-1 items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8B5CF6] border-t-transparent"></div>
            </div>
          ) : !historyData || historyData.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center text-text-muted">
              <History className="h-12 w-12 text-text-muted/20 mb-3" />
              <p className="text-sm font-medium">No transaction audit logs found.</p>
              <p className="text-xs text-text-secondary mt-1">Make a deposit or fund an escrow to initiate logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 rounded-2xl border border-white/60">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-white/40 text-text-secondary border-b border-white/70">
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Action</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Balance Shift</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Details</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 bg-white/20">
                  {[...historyData]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((log) => {
                      const isCredit = Number(log.newBalance) > Number(log.previousBalance);
                    const difference = Math.abs(Number(log.newBalance) - Number(log.previousBalance));
                    return (
                      <tr key={log.id} className="text-text-secondary hover:text-text-primary hover:bg-white/30 transition-all">
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isCredit ? 'bg-[#10B981]/15 text-[#059669] border border-[#10B981]/20' : 'bg-[#EF4444]/15 text-[#DC2626] border border-[#EF4444]/20'
                          }`}>
                            {isCredit ? <ArrowDownCircle className="h-3 w-3 shrink-0" /> : <ArrowUpCircle className="h-3 w-3 shrink-0" />}
                            <span>{log.action}</span>
                          </span>
                        </td>
                        <td className="p-4 font-bold text-text-primary">
                          {isCredit ? '+' : '-'}₹{difference.toFixed(2)}
                          <div className="text-[9px] text-text-muted font-bold mt-0.5 uppercase tracking-wider">
                            Bal: ₹{Number(log.newBalance).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-4 max-w-[180px] truncate text-xs font-medium" title={log.details}>
                          {log.details}
                        </td>
                        <td className="p-4 text-right text-xs font-semibold text-text-muted">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
