'use client';
import { motion } from 'framer-motion';
import { Subscription } from '@/types';
import { formatCurrency } from '@/lib/constants';
import { X, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useFinanceStore } from '@/store/financeStore';
import toast from 'react-hot-toast';

interface Props {
  subscriptions: Subscription[];
  onDetect: () => void;
  detecting: boolean;
}

export default function SubscriptionCard({ subscriptions, onDetect, detecting }: Props) {
  const { cancelSubscription } = useFinanceStore();

  const monthlyTotal = subscriptions.reduce((acc, s) => {
    if (s.frequency === 'monthly') return acc + s.amount;
    if (s.frequency === 'weekly') return acc + s.amount * 4.33;
    if (s.frequency === 'yearly') return acc + s.amount / 12;
    return acc;
  }, 0);

  const handleCancel = async (id: string, name: string) => {
    await cancelSubscription(id);
    toast.success(`${name} cancelled`);
  };

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Subscriptions</h3>
          {subscriptions.length > 0 && (
            <p className="text-gray-500 text-xs mt-0.5">
              {formatCurrency(Math.round(monthlyTotal))}/mo total
            </p>
          )}
        </div>
        <button
          onClick={onDetect}
          disabled={detecting}
          className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
          Detect
        </button>
      </div>

      {!subscriptions.length ? (
        <p className="text-gray-500 text-sm text-center py-4">
          Click Detect to find recurring payments
        </p>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub, i) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-2.5 bg-white/3 rounded-xl group"
            >
              <span className="text-xl">{sub.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{sub.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-500 text-[10px] capitalize">{sub.frequency}</span>
                  {sub.nextDue && (
                    <span className="flex items-center gap-0.5 text-gray-600 text-[10px]">
                      <Calendar size={9} />
                      {format(new Date(sub.nextDue), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-red-400 text-xs font-semibold">{formatCurrency(sub.amount)}</p>
              </div>
              <button
                onClick={() => handleCancel(sub._id, sub.name)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
