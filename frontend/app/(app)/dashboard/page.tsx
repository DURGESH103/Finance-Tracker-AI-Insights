'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTransactionStore } from '@/store/transactionStore';
import { useFinanceStore } from '@/store/financeStore';
import { useAuthStore } from '@/store/authStore';
import StatCard from '@/components/ui/StatCard';
import TransactionList from '@/components/ui/TransactionList';
import InsightsCard from '@/components/dashboard/InsightsCard';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import Modal from '@/components/ui/Modal';
import AddTransactionForm from '@/components/ui/AddTransactionForm';
import { formatCurrency } from '@/lib/constants';
import { TrendingUp, TrendingDown, Wallet, Plus, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { transactions, analytics, fetchTransactions, fetchAnalytics, deleteTransaction } = useTransactionStore();
  const { budgets, insights, fetchBudgets, fetchInsights, refreshInsights } = useFinanceStore();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions({ limit: 10 });
    fetchAnalytics();
    fetchBudgets();
    fetchInsights();
  }, []);

  const currentIncome = analytics?.currentMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const currentExpense = analytics?.currentMonthSummary.find((s) => s._id === 'expense')?.total || 0;
  const lastIncome = analytics?.lastMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const lastExpense = analytics?.lastMonthSummary.find((s) => s._id === 'expense')?.total || 0;
  const balance = currentIncome - currentExpense;

  const incomeChange = lastIncome ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
  const expenseChange = lastExpense ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

  // Build chart data from monthlyTrend
  const chartData = (() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    analytics?.monthlyTrend.forEach(({ _id, total }) => {
      const key = `${_id.year}-${_id.month}`;
      if (!map[key]) map[key] = { month: `${_id.month}/${_id.year}`, income: 0, expense: 0 };
      map[key][_id.type as 'income' | 'expense'] = total;
    });
    return Object.values(map);
  })();

  const handleRefreshInsights = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-violet-400">{user?.name?.split(' ')[0]}</span> 👋
          </motion.h1>
          <p className="text-gray-500 text-sm mt-1">Here's your financial overview</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Transaction
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Balance"
          amount={balance}
          icon={<Wallet size={18} className="text-violet-400" />}
          gradient="bg-gradient-to-br from-violet-600 to-indigo-600"
          delay={0}
        />
        <StatCard
          title="Income"
          amount={currentIncome}
          change={incomeChange}
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          gradient="bg-gradient-to-br from-emerald-600 to-teal-600"
          delay={0.05}
        />
        <StatCard
          title="Expenses"
          amount={currentExpense}
          change={expenseChange}
          icon={<TrendingDown size={18} className="text-red-400" />}
          gradient="bg-gradient-to-br from-red-600 to-rose-600"
          delay={0.1}
        />
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(v) => [`₹${Number(v).toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#income)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expense)" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <InsightsCard insights={insights} onRefresh={handleRefreshInsights} loading={refreshing} />
        </motion.div>
      </div>

      {/* Transactions + Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Recent Transactions</h3>
            <a href="/transactions" className="text-violet-400 text-xs hover:text-violet-300">View all</a>
          </div>
          <TransactionList transactions={transactions.slice(0, 8)} onDelete={deleteTransaction} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Budget Tracker</h3>
            <a href="/profile" className="text-violet-400 text-xs hover:text-violet-300">Manage</a>
          </div>
          <BudgetProgress budgets={budgets} />
        </motion.div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Transaction">
        <AddTransactionForm onSuccess={() => { setAddOpen(false); fetchAnalytics(); }} />
      </Modal>
    </div>
  );
}
