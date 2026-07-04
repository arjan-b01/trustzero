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
      // Refetch wallet data and history
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Wallet Hub
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your funds, execute secure deposits, and review financial audit trails.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 rounded-lg bg-card-dark border border-border-dark px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer hover:border-brand-primary/45 transition-all"
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
            className="rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary p-6 text-text-primary shadow-xl shadow-brand-primary/10 relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <WalletIcon className="h-40 w-40" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-80">Total Available Balance</span>
              <CircleDollarSign className="h-6 w-6 opacity-85" />
            </div>
            <div className="mt-6">
              <h2 className="text-4xl font-extrabold tracking-tight">
                {isWalletLoading ? '...' : `$${Number(walletData?.balance || 0).toFixed(2)}`}
              </h2>
              <p className="mt-2 text-xs opacity-75">
                Wallet ID: {isWalletLoading ? '...' : walletId || 'Not assigned'}
              </p>
            </div>
          </motion.div>

          {/* Deposit Form */}
          <div className="rounded-2xl glass-panel p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center space-x-2">
              <ArrowDownCircle className="h-5 w-5 text-brand-secondary" />
              <span>Deposit Funds</span>
            </h3>

            <form onSubmit={handleSubmit(onDeposit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-text-muted text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className={`block w-full rounded-lg border bg-bg-dark/50 py-2 pl-8 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all ${
                      errors.amount ? 'border-danger focus:ring-danger' : 'border-border-dark'
                    }`}
                    placeholder="100.00"
                    {...register('amount', {
                      required: 'Deposit amount is required',
                      min: { value: 1, message: 'Minimum deposit is $1.00' }
                    })}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={depositLoading}
                className="flex w-full justify-center items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary py-2.5 text-sm font-semibold text-text-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
              >
                {depositLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-primary border-t-transparent"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Deposit Money</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Table (Right 2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center space-x-2">
            <History className="h-5 w-5 text-brand-primary" />
            <span>Transaction & Wallet History</span>
          </h3>

          {isHistoryLoading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-primary border-t-transparent"></div>
            </div>
          ) : !historyData || historyData.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center text-text-muted">
              <History className="h-12 w-12 text-text-muted/30 mb-2" />
              <p className="text-sm">No transaction audit logs found.</p>
              <p className="text-xs text-text-secondary mt-1">Make a deposit or fund an escrow to initiate logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-dark text-text-secondary">
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">Balance Shift</th>
                    <th className="pb-3 font-semibold">Details</th>
                    <th className="pb-3 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {historyData.map((log) => {
                    const isCredit = Number(log.newBalance) > Number(log.previousBalance);
                    const difference = Math.abs(Number(log.newBalance) - Number(log.previousBalance));
                    return (
                      <tr key={log.id} className="text-text-secondary hover:text-text-primary transition-all">
                        <td className="py-3.5">
                          <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            isCredit ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                          }`}>
                            {isCredit ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                            <span>{log.action}</span>
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-text-primary">
                          {isCredit ? '+' : '-'}${difference.toFixed(2)}
                          <div className="text-[10px] text-text-muted font-normal mt-0.5">
                            Balance: ${Number(log.newBalance).toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3.5 max-w-[200px] truncate text-xs" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-3.5 text-right text-xs text-text-muted">
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
