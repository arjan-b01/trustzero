import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/wallet.service';
import escrowService from '../../services/escrow.service';
import {
  Wallet,
  Lock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  User,
  PlusCircle,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';

  // 1. Fetch Wallet Balance
  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet', userEmail],
    queryFn: () => walletService.getMyWallet(),
    enabled: !!userEmail,
  });

  // 2. Fetch Escrow List
  const escrows = escrowService.getEscrowList(userEmail);

  // 3. Compute Metrics
  const balance = walletData?.balance || 0;
  const activeEscrows = escrows.filter(e => e.status === 'FUNDED');
  const pendingDisputes = escrows.filter(e => e.status === 'DISPUTED');
  const completedEscrows = escrows.filter(e => e.status === 'RELEASED' || e.status === 'REFUNDED');

  const moneyLocked = escrows
     .filter(e => e.status === 'FUNDED' || e.status === 'DISPUTED')
     .reduce((sum, e) => sum + (e.lockedAmount || 0), 0);

  const moneyReleased = escrows
     .filter(e => e.status === 'RELEASED')
     .reduce((sum, e) => sum + (e.lockedAmount || 0), 0);

  // Cards configurations
  const stats = [
    { name: 'Wallet Balance', value: `$${Number(balance).toFixed(2)}`, icon: Wallet, color: 'text-[#8B5CF6] bg-[#8B5CF6]/10' },
    { name: 'Money Locked', value: `$${moneyLocked.toFixed(2)}`, icon: Lock, color: 'text-[#FFC371] bg-[#FFC371]/15' },
    { name: 'Money Released', value: `$${moneyReleased.toFixed(2)}`, icon: CheckCircle, color: 'text-[#10B981] bg-[#10B981]/10' },
    { name: 'Active Escrows', value: activeEscrows.length, icon: Activity, color: 'text-[#60A5FA] bg-[#60A5FA]/10' },
    { name: 'Pending Disputes', value: pendingDisputes.length, icon: AlertTriangle, color: 'text-[#EF4444] bg-[#EF4444]/10' },
    { name: 'Completed Escrows', value: completedEscrows.length, icon: CheckCircle, color: 'text-[#10B981] bg-[#10B981]/10' },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header banner */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back, <span className="text-gradient">{currentUser?.name}</span> 👋
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Here's what's happening with your TrustZero escrow dashboard today.
          </p>
        </div>

        {/* Quick actions buttons */}
        <div className="flex space-x-3.5">
          <Link
            to="/wallet"
            className="btn-secondary flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            <span>Deposit</span>
          </Link>
          <Link
            to="/escrows/create"
            className="btn-primary flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Escrow</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-6 shadow-sm relative overflow-hidden group glass-panel-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{stat.name}</span>
              <div className={`rounded-xl p-2.5 ${stat.color} transition-all duration-300 group-hover:scale-105`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold tracking-tight text-text-primary">
                {isWalletLoading && stat.name === 'Wallet Balance' ? '...' : stat.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Columns Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Escrows Table (Left) */}
        <div className="lg:col-span-2 glass-panel p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">Recent Escrow Contracts</h3>
            <Link to="/escrows" className="text-xs font-bold text-[#8B5CF6] hover:text-[#FF7EB6] transition-all">
              View all
            </Link>
          </div>

          {escrows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-text-muted">
              <Lock className="h-12 w-12 text-text-muted/20 mb-3" />
              <p className="text-sm font-medium">No escrow transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/60">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-white/40 text-text-secondary border-b border-white/70">
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Title</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Role</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Amount</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="p-4 font-semibold text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 bg-white/20">
                  {escrows.slice(0, 5).map((escrow) => {
                    const isUserBuyer = escrow.buyerName === currentUser?.name;
                    return (
                      <tr key={escrow.id} className="text-text-secondary hover:text-text-primary hover:bg-white/30 transition-all">
                        <td className="p-4 font-semibold text-text-primary max-w-[150px] truncate">{escrow.title}</td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isUserBuyer ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' : 'bg-[#FF7EB6]/10 text-[#FF7EB6] border border-[#FF7EB6]/20'
                          }`}>
                            {isUserBuyer ? 'BUYER' : 'SELLER'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-text-primary">${Number(escrow.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            escrow.status === 'RELEASED' ? 'bg-[#10B981]/15 text-[#059669]' :
                            escrow.status === 'FUNDED' ? 'bg-[#60A5FA]/15 text-[#2563EB]' :
                            escrow.status === 'DISPUTED' ? 'bg-[#EF4444]/15 text-[#DC2626]' :
                            escrow.status === 'REFUNDED' ? 'bg-[#FFC371]/20 text-[#D97706]' :
                            'bg-text-muted/15 text-text-muted'
                          }`}>
                            {escrow.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link
                            to={`/escrows/${escrow.id}`}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-[#8B5CF6] hover:text-[#FF7EB6] transition-all"
                          >
                            <span>Manage</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Activity / Profile Box (Right) */}
        <div className="glass-panel p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-6">Arbitration Status</h3>
            <div className="space-y-5">
              <div className="flex items-start space-x-3.5">
                <div className="rounded-xl bg-[#8B5CF6]/10 p-2.5 text-[#8B5CF6] border border-[#8B5CF6]/20 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Explainable AI Judges</h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Three parallel LLM advocate agents review claims deterministically before any payout or override.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="rounded-xl bg-[#FFC371]/15 p-2.5 text-[#D97706] border border-[#FFC371]/20 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Automatic Commission</h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Every transaction charges 3% platform commission automatically on escrow funding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/40 border border-white/70 p-4.5 flex items-center space-x-3.5 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7B61FF]/20 to-[#FF7EB6]/20 text-[#8B5CF6] font-bold border border-[#8B5CF6]/20 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Logged in as</p>
              <p className="text-xs font-semibold text-text-primary truncate" title={currentUser?.email}>{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
