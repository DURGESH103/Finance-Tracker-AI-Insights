'use client';
import { useEffect } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { useFinanceStore } from '@/store/financeStore';
import { CATEGORY_META, CHART_COLORS, formatCurrency } from '@/lib/constants';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13131f] border border-white/10 rounded-xl p-3 text-xs">
      <p className="text-gray-400 mb-1">{payload[0].name || payload[0].dataKey}</p>
      <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { analytics, fetchAnalytics } = useTransactionStore();
  const { prediction, fetchPrediction, patterns, fetchPatterns, netWorthHistory, fetchNetWorth } = useFinanceStore();

  useEffect(() => {
    fetchAnalytics();
    fetchPrediction();
    fetchPatterns();
    fetchNetWorth();
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

  // Savings rate trend from monthly data
  const savingsTrend = barData.map((m) => ({
    month: m.month,
    rate: m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 100) : 0,
  }));

  const currentIncome = analytics?.currentMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const currentExpense = analytics?.currentMonthSummary.find((s) => s._id === 'expense')?.total || 0;
  const savings = currentIncome - currentExpense;
  const savingsPct = currentIncome ? ((savings / currentIncome) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Deep dive into your financial patterns</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <Legend formatter={(v) => <span className="text-gray-400 text-xs capitalize">{v}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No expense data this month</p>
          )}
        </motion.div>

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
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`₹${Number(v).toLocaleString()}`, '']} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Net Worth + Savings Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-4">Net Worth Trend</h3>
          {netWorthHistory.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={netWorthHistory}>
                <defs>
                  <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Net Worth']} />
                <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2} fill="url(#nw)" name="Net Worth" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">Not enough data yet</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-4">Savings Rate Trend (%)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={savingsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Savings Rate']} />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Savings Rate" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Day-of-week spending pattern */}
      {patterns && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Spending by Day of Week</h3>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Weekend: {formatCurrency(patterns.weekendVsWeekday.weekend)}</span>
              <span>Weekday: {formatCurrency(patterns.weekendVsWeekday.weekday)}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={patterns.dowBreakdown} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Spent']} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {patterns.dowBreakdown.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.day === patterns.peakSpendingDay ? '#ef4444' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-gray-500 text-xs mt-2 text-center">
            🔴 Peak spending day: <span className="text-red-400 font-medium">{patterns.peakSpendingDay}</span>
          </p>
        </motion.div>
      )}

      {/* Category breakdown table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
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
