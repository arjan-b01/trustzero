import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import escrowService from '../../services/escrow.service';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Scroll, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const EscrowList = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';

  const escrows = escrowService.getEscrowList(userEmail);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter Logic
  const filteredEscrows = escrows.filter((escrow) => {
    const matchesSearch = escrow.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          escrow.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUserBuyer = escrow.buyerName === currentUser?.name;
    const matchesRole = roleFilter === 'ALL' ||
                        (roleFilter === 'BUYER' && isUserBuyer) ||
                        (roleFilter === 'SELLER' && !isUserBuyer);

    const matchesStatus = statusFilter === 'ALL' || escrow.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Escrow Agreements
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your secure payment contracts, release funds, or file claim arbitrations.
          </p>
        </div>

        <Link
          to="/escrows/create"
          className="flex items-center space-x-2 rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-sm font-semibold text-text-primary shadow-sm hover:opacity-90 transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Escrow</span>
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="rounded-2xl glass-panel p-4 flex flex-col gap-4 md:flex-row md:items-center justify-between">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-border-dark bg-bg-dark/50 py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-hidden transition-all"
            placeholder="Search agreements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter inputs dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              className="rounded-lg border border-border-dark bg-bg-dark/50 px-3 py-2 text-xs text-text-secondary focus:border-brand-primary focus:outline-hidden cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="BUYER">As Buyer</option>
              <option value="SELLER">As Seller</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            className="rounded-lg border border-border-dark bg-bg-dark/50 px-3 py-2 text-xs text-text-secondary focus:border-brand-primary focus:outline-hidden cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">CREATED</option>
            <option value="FUNDED">FUNDED</option>
            <option value="RELEASED">RELEASED</option>
            <option value="DISPUTED">DISPUTED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Escrows Data Grid/Table */}
      {filteredEscrows.length === 0 ? (
        <div className="rounded-2xl glass-panel p-16 flex flex-col items-center justify-center text-center text-text-muted">
          <Scroll className="h-16 w-16 text-text-muted/30 mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">No Agreements Found</h3>
          <p className="text-sm max-w-sm">No escrow agreements match your active filters. Try resetting search parameters or create a new contract.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEscrows.map((escrow, i) => {
            const isUserBuyer = escrow.buyerName === currentUser?.name;
            return (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl glass-panel p-6 shadow-sm flex flex-col justify-between glass-panel-hover transition-all"
              >
                <div>
                  {/* Status & Role badge Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                      isUserBuyer ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                    }`}>
                      {isUserBuyer ? 'BUYER' : 'SELLER'}
                    </span>

                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      escrow.status === 'RELEASED' ? 'bg-success/15 text-success' :
                      escrow.status === 'FUNDED' ? 'bg-brand-secondary/15 text-brand-secondary' :
                      escrow.status === 'DISPUTED' ? 'bg-danger/15 text-danger' :
                      escrow.status === 'REFUNDED' ? 'bg-warning/15 text-warning' :
                      'bg-text-muted/15 text-text-muted'
                    }`}>
                      {escrow.status}
                    </span>
                  </div>

                  {/* Escrow Title & Description */}
                  <h3 className="text-lg font-bold text-text-primary truncate mb-1">{escrow.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2 mb-4 h-8">{escrow.description}</p>
                </div>

                {/* Amount and Navigation row */}
                <div className="border-t border-border-dark pt-4 mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Locked Funds</p>
                    <p className="text-lg font-extrabold text-text-primary">${Number(escrow.amount).toFixed(2)}</p>
                  </div>

                  <Link
                    to={`/escrows/${escrow.id}`}
                    className="flex items-center space-x-1.5 rounded-lg bg-card-dark border border-border-dark px-3.5 py-2 text-xs font-bold text-text-primary hover:border-brand-primary/45 transition-all"
                  >
                    <span>Manage</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EscrowList;
