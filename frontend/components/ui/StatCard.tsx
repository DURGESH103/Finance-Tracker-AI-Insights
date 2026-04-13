'use client';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/constants';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  amount: number;
  change?: number;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

export default function StatCard({ title, amount, change, icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative bg-white/5 backdrop-blur border border-white/8 rounded-2xl p-5 overflow-hidden"
    >
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm font-medium">{title}</span>
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{formatCurrency(amount)}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change).toFixed(1)}% vs last month
          </div>
        )}
      </div>
    </motion.div>
  );
}
