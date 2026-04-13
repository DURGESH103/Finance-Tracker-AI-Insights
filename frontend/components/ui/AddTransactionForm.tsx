'use client';
import { useState } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { CATEGORIES, CATEGORY_META } from '@/lib/constants';
import { Category } from '@/types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  onSuccess?: () => void;
}

export default function AddTransactionForm({ onSuccess }: Props) {
  const { addTransaction } = useTransactionStore();
  const [form, setForm] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'other' as Category,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      await addTransaction({ ...form, amount: Number(form.amount) });
      toast.success('Transaction added!');
      setForm({ amount: '', type: 'expense', category: 'other', description: '', date: new Date().toISOString().split('T')[0] });
      onSuccess?.();
    } catch {
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-xl bg-white/5 p-1 gap-1">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm({ ...form, type: t })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              form.type === t
                ? t === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
        <input
          type="number"
          placeholder="0"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className={`${inputCls} pl-8 text-xl font-bold`}
          required
        />
      </div>

      {/* Category grid */}
      <div>
        <p className="text-gray-400 text-xs mb-2">Category</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs ${
                  form.category === cat
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-white/5 bg-white/3 text-gray-500 hover:border-white/20'
                }`}
              >
                <span className="text-base">{meta.icon}</span>
                <span className="capitalize truncate w-full text-center">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <input
        type="text"
        placeholder="Description (optional — AI will auto-categorize)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className={inputCls}
      />

      {/* Date */}
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        className={inputCls}
      />

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Transaction'}
      </motion.button>
    </form>
  );
}
