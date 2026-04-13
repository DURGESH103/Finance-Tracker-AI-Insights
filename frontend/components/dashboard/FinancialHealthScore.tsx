'use client';
import { motion } from 'framer-motion';
import { FinancialScore } from '@/types';

interface Props {
  score: FinancialScore | null;
  loading?: boolean;
}

const GRADE_COLOR: Record<string, string> = {
  'A+': 'text-emerald-400',
  'A': 'text-green-400',
  'B': 'text-yellow-400',
  'C': 'text-orange-400',
  'D': 'text-red-400',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  savingsRate: 'Savings Rate',
  budgetAdherence: 'Budget Control',
  expenseConsistency: 'Consistency',
  goalProgress: 'Goal Progress',
  incomeStability: 'Income',
};

const MAX: Record<string, number> = {
  savingsRate: 30,
  budgetAdherence: 25,
  expenseConsistency: 20,
  goalProgress: 15,
  incomeStability: 10,
};

export default function FinancialHealthScore({ score, loading }: Props) {
  const circumference = 2 * Math.PI * 54;
  const progress = score ? (score.score / 100) * circumference : 0;

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Financial Health Score</h3>

      {loading || !score ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Circular gauge */}
          <div className="flex items-center gap-6 mb-5">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <motion.circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={score.score >= 80 ? '#10b981' : score.score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - progress }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{score.score}</span>
                <span className={`text-sm font-bold ${GRADE_COLOR[score.grade] || 'text-gray-400'}`}>
                  {score.grade}
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-2">
              {Object.entries(score.breakdown).map(([key, val]) => {
                const pct = (val / MAX[key]) * 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-gray-400 text-[11px]">{BREAKDOWN_LABELS[key]}</span>
                      <span className="text-gray-300 text-[11px]">{val}/{MAX[key]}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
