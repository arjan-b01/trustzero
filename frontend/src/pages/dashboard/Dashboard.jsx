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
  PlusCircle
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
    { name: 'Wallet Balance', value: `$${Number(balance).toFixed(2)}`, icon: Wallet, color: 'text-brand-primary' },
    { name: 'Money Locked', value: `$${moneyLocked.toFixed(2)}`, icon: Lock, color: 'text-warning' },
    { name: 'Money Released', value: `$${moneyReleased.toFixed(2)}`, icon: CheckCircle, color: 'text-success' },
    { name: 'Active Escrows', value: activeEscrows.length, icon: Activity, color: 'text-brand-secondary' },
    { name: 'Pending Disputes', value: pendingDisputes.length, icon: AlertTriangle, color: 'text-danger' },
    { name: 'Completed Escrows', value: completedEscrows.length, icon: CheckCircle, color: 'text-success' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back, <span className="text-gradient">{currentUser?.name}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here's what's happening with your TrustZero escrow dashboard today.
          </p>
        </div>

        {/* Quick actions buttons */}
        <div className="flex space-x-3">
          <Link
            to="/wallet"
            className="flex items-center space-x-2 rounded-lg bg-card-dark border border-border-dark px-4 py-2 text-sm font-medium hover:border-brand-primary/50 transition-all text-text-primary cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            <span>Deposit</span>
          </Link>
          <Link
            to="/escrows/create"
            className="flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-4 py-2 text-sm font-semibold text-text-primary shadow-sm hover:opacity-90 transition-all cursor-pointer"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl glass-panel p-6 shadow-sm relative overflow-hidden group glass-panel-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">{stat.name}</span>
              <div className={`rounded-xl bg-card-dark border border-border-dark p-2 ${stat.color}`}>
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
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">Recent Escrow Contracts</h3>
            <Link to="/escrows" className="text-xs text-brand-primary hover:underline">
              View all
            </Link>
          </div>

          {escrows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
              <Lock className="h-12 w-12 text-text-muted/30 mb-2" />
              <p>No escrow transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-dark text-text-secondary">
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {escrows.slice(0, 5).map((escrow) => {
                    const isUserBuyer = escrow.buyerName === currentUser?.name;
                    return (
                      <tr key={escrow.id} className="text-text-secondary hover:text-text-primary">
                        <td className="py-3.5 font-medium text-text-primary">{escrow.title}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isUserBuyer ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-accent/10 text-brand-accent'
                          }`}>
                            {isUserBuyer ? 'BUYER' : 'SELLER'}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-text-primary">${Number(escrow.amount).toFixed(2)}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            escrow.status === 'RELEASED' ? 'bg-success/15 text-success' :
                            escrow.status === 'FUNDED' ? 'bg-brand-secondary/15 text-brand-secondary' :
                            escrow.status === 'DISPUTED' ? 'bg-danger/15 text-danger' :
                            escrow.status === 'REFUNDED' ? 'bg-warning/15 text-warning' :
                            'bg-text-muted/15 text-text-muted'
                          }`}>
                            {escrow.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <Link
                            to={`/escrows/${escrow.id}`}
                            className="flex items-center space-x-1 text-xs text-brand-primary hover:text-brand-secondary transition-all"
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
        <div className="rounded-2xl glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-6">Arbitration Status</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="rounded-lg bg-brand-primary/10 p-2 text-brand-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Explainable AI Judges</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Three parallel LLM advocate agents review claims deteministically before any payout or override.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="rounded-lg bg-warning/10 p-2 text-warning">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Automatic Commission</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Every transaction charges 3% platform commission automatically on escrow funding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-card-dark border border-border-dark p-4 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-secondary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Logged in as</p>
              <p className="text-sm font-semibold text-text-primary truncate max-w-[150px]">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
