'use client';
import { useEffect, useState } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { useFinanceStore } from '@/store/financeStore';
import { CATEGORY_META, CHART_COLORS, formatCurrency } from '@/lib/constants';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';

export default function AnalyticsPage() {
  const { analytics, fetchAnalytics } = useTransactionStore();
  const { prediction, fetchPrediction } = useFinanceStore();

  useEffect(() => {
    fetchAnalytics();
    fetchPrediction();
  }, []);

  const pieData = analytics?.categoryBreakdown.map((c) => ({
    name: c._id,
    value: c.total,
    icon: CATEGORY_META[c._id as keyof typeof CATEGORY_META]?.icon || '📦',
  })) || [];

  const barData = (() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    analytics?.monthlyTrend.forEach(({ _id, total }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: `${_id.month}/${_id.year}`, income: 0, expense: 0 };
      map[key][_id.type as 'income' | 'expense'] = total;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const currentIncome = analytics?.currentMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const currentExpense = analytics?.currentMonthSummary.find((s) => s._id === 'expense')?.total || 0;
  const savings = currentIncome - currentExpense;
  const savingsPct = currentIncome ? ((savings / currentIncome) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#13131f] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{payload[0].name}</p>
        <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Deep dive into your spending patterns</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Income', value: currentIncome, color: 'text-emerald-400' },
          { label: 'Expenses', value: currentExpense, color: 'text-red-400' },
          { label: 'Savings', value: savings, color: savings >= 0 ? 'text-violet-400' : 'text-red-400' },
          { label: 'Predicted Next Month', value: prediction || 0, color: 'text-yellow-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 border border-white/8 rounded-2xl p-4"
          >
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
            {label === 'Savings' && (
              <p className="text-gray-500 text-xs mt-1">{savingsPct}% of income</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-4">Spending by Category</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-gray-400 text-xs capitalize">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No expense data this month</p>
          )}
        </motion.div>

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [`₹${Number(v).toLocaleString()}`, '']}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category breakdown table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 border border-white/8 rounded-2xl p-5"
      >
        <h3 className="text-white font-semibold text-sm mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {pieData.map((item, i) => {
            const pct = currentExpense ? ((item.value / currentExpense) * 100).toFixed(1) : '0';
            return (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-lg w-6">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-xs font-medium capitalize">{item.name}</span>
                    <span className="text-gray-400 text-xs">{formatCurrency(item.value)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
