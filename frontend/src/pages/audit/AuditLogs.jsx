import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/wallet.service';
import escrowService from '../../services/escrow.service';
import auditService from '../../services/audit.service';
import { History, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuditLogs = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // 1. Fetch Wallet ID
  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet', userEmail],
    queryFn: () => walletService.getMyWallet(),
    enabled: !!userEmail
  });

  const walletId = walletData?.walletId;

  // 2. Fetch Wallet audit log history
  const { data: walletLogs, isLoading: isWalletLogsLoading } = useQuery({
    queryKey: ['wallet-history', walletId],
    queryFn: () => auditService.getWalletHistory(walletId),
    enabled: !!walletId
  });

  // 3. Fetch all Escrows
  const { data: escrows = [], isLoading: isEscrowsLoading } = useQuery({
    queryKey: ['escrows', userEmail],
    queryFn: () => escrowService.getEscrowList(),
    enabled: !!userEmail,
  });

  // 4. Fetch Escrow audit logs in parallel using custom query logic
  const { data: combinedLogs, isLoading: isEscrowLogsLoading } = useQuery({
    queryKey: ['combined-audit-logs', escrows.map(e => e.id).join(',')],
    queryFn: async () => {
      const logsPromises = escrows.map(async (escrow) => {
        try {
          return await auditService.getEscrowHistory(escrow.id);
        } catch {
          return [];
        }
      });
      const results = await Promise.all(logsPromises);
      return results.flat();
    },
    enabled: escrows && escrows.length > 0
  });

  // 5. Merge and Sort Logs
  const allLogs = [
    ...(walletLogs || []),
    ...(combinedLogs || [])
  ];

  // Deduplicate by ID
  const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());

  // Sort by timestamp desc
  const sortedLogs = uniqueLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Filter Logs
  const filteredLogs = sortedLogs.filter((log) => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const isLoading = isWalletLoading || isWalletLogsLoading || isEscrowLogsLoading || isEscrowsLoading;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary flex items-center space-x-2">
          <History className="h-8 w-8 text-[#8B5CF6]" />
          <span>Immutable Audit Logs</span>
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Browse permanent, unalterable system events, transaction logs, and AI decisions.
        </p>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 flex flex-col gap-4 md:flex-row md:items-center justify-between shadow-xs bg-white/40 border-white/60">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full glass-input py-2.5 pl-11 pr-3 transition-all border-white/80"
            placeholder="Search details or actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Action filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            className="glass-input px-3.5 py-2 text-xs font-semibold border-white/80 cursor-pointer"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="ESCROW_FUNDED">ESCROW_FUNDED</option>
            <option value="ESCROW_RELEASED">ESCROW_RELEASED</option>
            <option value="ADMIN_COMMISSION">ADMIN_COMMISSION</option>
            <option value="AI-DECIDED">AI-DECIDED</option>
            <option value="AI-ESCALATED">AI-ESCALATED</option>
            <option value="DISPUTE_RELEASED">DISPUTE_RELEASED</option>
            <option value="DISPUTE_REFUNDED">DISPUTE_REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8B5CF6] border-t-transparent"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel p-20 flex flex-col items-center justify-center text-center text-text-muted bg-white/40 shadow-xs">
          <History className="h-16 w-16 text-text-muted/20 mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">No Log Entries</h3>
          <p className="text-sm max-w-sm leading-relaxed">No transaction audit reports exist matching your search parameters.</p>
        </div>
      ) : (
        <div className="glass-panel p-8 shadow-sm bg-white/40 border-white/60">
          <div className="relative border-l-2 border-white/80 pl-6 space-y-8">
            {filteredLogs.map((log, i) => {
              const isCredit = log.newBalance !== undefined && Number(log.newBalance) > Number(log.previousBalance);
              const isAI = log.action.startsWith('AI-');
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group"
                >
                  {/* Timeline icon node */}
                  <span className={`absolute -left-[35px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border transition-all shadow-2xs ${
                    isAI ? 'bg-[#FF7EB6]/20 border-[#FF7EB6] text-[#FF7EB6]' :
                    isCredit ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' :
                    'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  </span>

                  {/* Header Title action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="text-sm font-bold text-text-primary uppercase tracking-wide">
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-text-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Body description */}
                  <p className="text-xs text-text-secondary mt-1.5 max-w-4xl leading-relaxed font-semibold">
                    {log.details}
                  </p>

                  {/* Meta data tags row */}
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-text-muted font-mono font-bold">
                    <span className="bg-white/50 border border-white/70 rounded-full px-2.5 py-0.5 shadow-2xs">
                      Log ID: #{log.id}
                    </span>
                    {log.walletId && (
                      <span className="bg-white/50 border border-white/70 rounded-full px-2.5 py-0.5 shadow-2xs">
                        Wallet ID: {log.walletId}
                      </span>
                    )}
                    {log.escrowTransactionId && (
                      <span className="bg-white/50 border border-white/70 rounded-full px-2.5 py-0.5 shadow-2xs">
                        Escrow ID: {log.escrowTransactionId}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
