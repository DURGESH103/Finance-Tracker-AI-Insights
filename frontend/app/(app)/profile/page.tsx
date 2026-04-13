'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useFinanceStore } from '@/store/financeStore';
import { useEffect } from 'react';
import { CATEGORIES, CATEGORY_META } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Trash2, Plus, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { budgets, fetchBudgets, addBudget, deleteBudget } = useFinanceStore();
  const [form, setForm] = useState({ category: 'food', limit: '' });

  useEffect(() => { fetchBudgets(); }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.limit || isNaN(Number(form.limit))) return toast.error('Enter a valid limit');
    try {
      await addBudget({ category: form.category, limit: Number(form.limit), period: 'monthly' });
      toast.success('Budget saved!');
      setForm({ category: 'food', limit: '' });
    } catch {
      toast.error('Failed to save budget');
    }
  };

  const inputCls = 'bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Profile & Settings</h1>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/8 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <p className="text-gray-500 text-xs mt-1">Currency: {user?.currency || 'INR'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-5 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </motion.div>

      {/* Budget management */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/8 rounded-2xl p-6"
      >
        <h3 className="text-white font-semibold mb-5">Monthly Budgets</h3>

        {/* Add budget form */}
        <form onSubmit={handleAddBudget} className="flex gap-3 mb-6">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={`${inputCls} flex-1`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#13131f] capitalize">
                {CATEGORY_META[c].icon} {c}
              </option>
            ))}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              placeholder="Limit"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
              className={`${inputCls} pl-7 w-32`}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Plus size={14} /> Set
          </motion.button>
        </form>

        {/* Budget list */}
        {!budgets.length ? (
          <p className="text-gray-500 text-sm text-center py-4">No budgets set for this month</p>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => {
              const meta = CATEGORY_META[b.category as keyof typeof CATEGORY_META] || CATEGORY_META.other;
              const pct = Math.min((b.spent / b.limit) * 100, 100);
              const over = b.spent > b.limit;
              return (
                <div key={b._id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                  <span className="text-lg">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-xs font-medium capitalize">{b.category}</span>
                      <span className={`text-xs ${over ? 'text-red-400' : 'text-gray-400'}`}>
                        ₹{b.spent.toLocaleString()} / ₹{b.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-violet-500'}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBudget(b._id)}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
