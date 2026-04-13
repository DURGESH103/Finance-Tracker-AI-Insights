'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/constants';
import { Calculator, TrendingUp, Target, Zap } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

interface SimResult {
  inputs: Record<string, number>;
  realAvgExpense: number;
  currentMonthlySavings: number;
  improvedMonthlySavings: number;
  scenarios: {
    current: { label: string; data: { month: number; cumulative: number }[]; finalValue: number };
    reduced: { label: string; data: { month: number; cumulative: number }[]; finalValue: number };
    invested: { label: string; data: { month: number; cumulative: number }[]; finalValue: number };
  };
  goalProjections: {
    title: string; icon: string; targetAmount: number; savedAmount: number;
    remaining: number; monthsNeeded: number | null; achieveDate: string | null; onTrack: boolean | null;
  }[];
  totalSavingsGain: number;
}

export default function SimulatorPage() {
  const [form, setForm] = useState({
    monthlyIncome: '',
    monthlyExpenses: '',
    reductionPercent: '10',
    months: '12',
    annualReturnRate: '8',
  });
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monthlyIncome || !form.monthlyExpenses) return toast.error('Enter income and expenses');
    setLoading(true);
    try {
      const { data } = await api.post('/simulator', {
        monthlyIncome: Number(form.monthlyIncome),
        monthlyExpenses: Number(form.monthlyExpenses),
        reductionPercent: Number(form.reductionPercent),
        months: Number(form.months),
        annualReturnRate: Number(form.annualReturnRate),
      });
      setResult(data.data);
    } catch {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  // Merge scenario data for chart
  const chartData = result
    ? result.scenarios.current.data.map((d, i) => ({
        month: `M${d.month}`,
        Current: d.cumulative,
        Reduced: result.scenarios.reduced.data[i]?.cumulative || 0,
        Invested: result.scenarios.invested.data[i]?.cumulative || 0,
      }))
    : [];

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator size={24} className="text-violet-400" /> Financial Simulator
        </h1>
        <p className="text-gray-500 text-sm mt-1">Model your savings scenarios and predict future wealth</p>
      </div>

      {/* Input form */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/8 rounded-2xl p-6">
        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Monthly Income (₹)</label>
            <input type="number" placeholder="e.g. 80000" value={form.monthlyIncome}
              onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Monthly Expenses (₹)</label>
            <input type="number" placeholder="e.g. 55000" value={form.monthlyExpenses}
              onChange={(e) => setForm({ ...form, monthlyExpenses: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Expense Reduction (%)</label>
            <input type="number" min="0" max="100" value={form.reductionPercent}
              onChange={(e) => setForm({ ...form, reductionPercent: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Projection Period (months)</label>
            <input type="number" min="1" max="120" value={form.months}
              onChange={(e) => setForm({ ...form, months: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Annual Return Rate (%)</label>
            <input type="number" min="0" max="50" value={form.annualReturnRate}
              onChange={(e) => setForm({ ...form, annualReturnRate: e.target.value })} className={inputCls} />
          </div>
          <div className="flex items-end">
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap size={16} />
              {loading ? 'Simulating...' : 'Run Simulation'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {result && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Current Savings/mo', value: formatCurrency(result.currentMonthlySavings), color: 'text-white' },
              { label: 'Improved Savings/mo', value: formatCurrency(result.improvedMonthlySavings), color: 'text-emerald-400' },
              { label: 'Extra Gain', value: formatCurrency(result.totalSavingsGain), color: 'text-violet-400' },
              { label: 'Invested Final Value', value: formatCurrency(result.scenarios.invested.finalValue), color: 'text-yellow-400' },
            ].map(({ label, value, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </motion.div>
            ))}
          </div>

          {/* Scenario chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" /> Savings Projection Scenarios
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(Number(v)), '']} />
                <Legend formatter={(v) => <span className="text-gray-400 text-xs">{v}</span>} />
                <Line type="monotone" dataKey="Current" stroke="#6b7280" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Reduced" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Invested" stroke="#6366f1" strokeWidth={2.5} dot={false} strokeDasharray="0" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Goal projections */}
          {result.goalProjections.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Target size={16} className="text-violet-400" /> Goal Achievement Timeline
              </h3>
              <div className="space-y-3">
                {result.goalProjections.map((g, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 p-3 bg-white/3 rounded-xl">
                    <span className="text-2xl">{g.icon}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{g.title}</p>
                      <p className="text-gray-500 text-xs">
                        {formatCurrency(g.remaining)} remaining
                        {g.monthsNeeded ? ` · ~${g.monthsNeeded} months` : ' · Not achievable at current rate'}
                      </p>
                    </div>
                    <div className="text-right">
                      {g.achieveDate && (
                        <p className="text-gray-300 text-xs">{new Date(g.achieveDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                      )}
                      {g.onTrack !== null && (
                        <span className={`text-xs font-medium ${g.onTrack ? 'text-emerald-400' : 'text-red-400'}`}>
                          {g.onTrack ? '✓ On track' : '✗ Behind'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
