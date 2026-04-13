'use client';
import { useEffect, useState } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import TransactionList from '@/components/ui/TransactionList';
import Modal from '@/components/ui/Modal';
import AddTransactionForm from '@/components/ui/AddTransactionForm';
import { CATEGORIES } from '@/lib/constants';
import { Plus, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TransactionsPage() {
  const { transactions, total, pages, loading, fetchTransactions, deleteTransaction } = useTransactionStore();
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', category: '', search: '' });

  useEffect(() => {
    const params: Record<string, string | number> = { page, limit: 20 };
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    fetchTransactions(params);
  }, [page, filters]);

  const inputCls = 'bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total transactions</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            className={`${inputCls} pl-8 w-full`}
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
          className={inputCls}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
          className={inputCls}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <TransactionList transactions={transactions} onDelete={deleteTransaction} />
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Transaction">
        <AddTransactionForm onSuccess={() => { setAddOpen(false); fetchTransactions({ page, limit: 20 }); }} />
      </Modal>
    </div>
  );
}
