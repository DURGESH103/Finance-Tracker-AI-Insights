'use client';
import { Budget } from '@/types';
import { CATEGORY_META } from '@/lib/constants';
import { motion } from 'framer-motion';

interface Props { budgets: Budget[] }

export default function BudgetProgress({ budgets }: Props) {
  if (!budgets.length)
    return <p className="text-gray-500 text-sm text-center py-4">No budgets set</p>;

  return (
    <div className="space-y-3">
      {budgets.map((b) => {
        const pct = Math.min((b.spent / b.limit) * 100, 100);
        const over = b.spent > b.limit;
        const meta = CATEGORY_META[b.category as keyof typeof CATEGORY_META] || CATEGORY_META.other;
        return (
          <div key={b._id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-white text-xs font-medium capitalize">{b.category}</span>
              </div>
              <span className={`text-xs font-medium ${over ? 'text-red-400' : 'text-gray-400'}`}>
                ₹{b.spent.toLocaleString()} / ₹{b.limit.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-violet-500'}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
