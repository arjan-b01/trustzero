import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import escrowService from '../../services/escrow.service';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Scroll, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const EscrowList = () => {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || '';

  const { data: escrows = [], isLoading } = useQuery({
    queryKey: ['escrows', userEmail],
    queryFn: () => escrowService.getEscrowList(),
    enabled: !!userEmail,
  });

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
          <p className="mt-1.5 text-sm text-text-secondary">
            Manage your secure payment contracts, release funds, or file claim arbitrations.
          </p>
        </div>

        <Link
          to="/escrows/create"
          className="btn-primary flex items-center space-x-2 px-5 py-3 text-sm font-semibold cursor-pointer shadow-md"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Escrow</span>
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-4 flex flex-col gap-4 md:flex-row md:items-center justify-between shadow-xs bg-white/40 border-white/60">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full glass-input py-2.5 pl-11 pr-3 transition-all border-white/80"
            placeholder="Search agreements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter inputs dropdowns */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              className="glass-input px-3.5 py-2 text-xs font-semibold border-white/80 cursor-pointer"
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
            className="glass-input px-3.5 py-2 text-xs font-semibold border-white/80 cursor-pointer"
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
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8B5CF6] border-t-transparent"></div>
        </div>
      ) : filteredEscrows.length === 0 ? (
        <div className="glass-panel p-20 flex flex-col items-center justify-center text-center text-text-muted shadow-xs bg-white/40">
          <Scroll className="h-16 w-16 text-text-muted/20 mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">No Agreements Found</h3>
          <p className="text-sm max-w-sm leading-relaxed">No escrow agreements match your active filters. Try resetting search parameters or create a new contract.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEscrows.map((escrow, i) => {
            const isUserBuyer = escrow.buyerName === currentUser?.name;
            return (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="glass-panel p-6 shadow-sm flex flex-col justify-between glass-panel-hover"
              >
                <div>
                  {/* Status & Role badge Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                      isUserBuyer 
                        ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' 
                        : 'bg-[#FF7EB6]/10 text-[#FF7EB6] border border-[#FF7EB6]/20'
                    }`}>
                      {isUserBuyer ? 'BUYER' : 'SELLER'}
                    </span>

                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      escrow.status === 'RELEASED' ? 'bg-[#10B981]/15 text-[#059669]' :
                      escrow.status === 'FUNDED' ? 'bg-[#60A5FA]/15 text-[#2563EB]' :
                      escrow.status === 'DISPUTED' ? 'bg-[#EF4444]/15 text-[#DC2626]' :
                      escrow.status === 'REFUNDED' ? 'bg-[#FFC371]/20 text-[#D97706]' :
                      'bg-text-muted/15 text-text-muted'
                    }`}>
                      {escrow.status}
                    </span>
                  </div>

                  {/* Escrow Title & Description */}
                  <h3 className="text-base font-bold text-text-primary truncate mb-1">{escrow.title}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2 mb-5 h-8 font-medium">{escrow.description}</p>
                </div>

                {/* Amount and Navigation row */}
                <div className="border-t border-white/60 pt-4 mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Locked Funds</p>
                    <p className="text-lg font-black text-text-primary leading-tight">${Number(escrow.amount).toFixed(2)}</p>
                  </div>

                  <Link
                    to={`/escrows/${escrow.id}`}
                    className="btn-secondary flex items-center space-x-1.5 px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    <span>Manage</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
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
