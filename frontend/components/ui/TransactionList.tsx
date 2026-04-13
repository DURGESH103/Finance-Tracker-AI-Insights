'use client';
import { motion } from 'framer-motion';
import { Transaction } from '@/types';
import { CATEGORY_META, formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: Props) {
  if (!transactions.length)
    return <p className="text-gray-500 text-sm text-center py-8">No transactions found</p>;

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const meta = CATEGORY_META[tx.category] || CATEGORY_META.other;
        return (
          <motion.div
            key={tx._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-lg flex-shrink-0`}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{tx.description || tx.category}</p>
              <p className="text-gray-500 text-xs">{format(new Date(tx.date), 'MMM d, yyyy')} · {tx.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              {tx.aiCategorized && <span className="text-[10px] text-violet-400">AI</span>}
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(tx._id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-1"
              >
                <Trash2 size={14} />
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
