'use client';
import { motion } from 'framer-motion';
import { Insight } from '@/types';
import { Lightbulb, AlertTriangle, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';

const ICONS = {
  tip: <Lightbulb size={16} className="text-yellow-400" />,
  warning: <AlertTriangle size={16} className="text-red-400" />,
  prediction: <TrendingUp size={16} className="text-violet-400" />,
  summary: <BarChart2 size={16} className="text-blue-400" />,
};

const COLORS = {
  tip: 'border-yellow-500/20 bg-yellow-500/5',
  warning: 'border-red-500/20 bg-red-500/5',
  prediction: 'border-violet-500/20 bg-violet-500/5',
  summary: 'border-blue-500/20 bg-blue-500/5',
};

interface Props {
  insights: Insight[];
  onRefresh?: () => void;
  loading?: boolean;
}

export default function InsightsCard({ insights, onRefresh, loading }: Props) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <h3 className="text-white font-semibold text-sm">AI Insights</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-gray-500 hover:text-violet-400 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!insights.length ? (
        <p className="text-gray-500 text-sm text-center py-4">
          Click refresh to generate AI insights
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <motion.div
              key={insight._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-3 rounded-xl border ${COLORS[insight.type]}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">{ICONS[insight.type]}</div>
                <div>
                  <p className="text-white text-xs font-semibold mb-0.5">{insight.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{insight.text}</p>
                  {insight.savingsAmount && (
                    <p className="text-emerald-400 text-xs mt-1 font-medium">
                      Save ₹{insight.savingsAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
