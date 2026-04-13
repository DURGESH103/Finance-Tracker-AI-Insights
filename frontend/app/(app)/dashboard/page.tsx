'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTransactionStore } from '@/store/transactionStore';
import { useFinanceStore } from '@/store/financeStore';
import { useGoalStore } from '@/store/goalStore';
import { useAuthStore } from '@/store/authStore';
import StatCard from '@/components/ui/StatCard';
import TransactionList from '@/components/ui/TransactionList';
import InsightsCard from '@/components/dashboard/InsightsCard';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import FinancialHealthScore from '@/components/dashboard/FinancialHealthScore';
import GoalsTracker from '@/components/dashboard/GoalsTracker';
import GamificationCard from '@/components/dashboard/GamificationCard';
import SubscriptionCard from '@/components/dashboard/SubscriptionCard';
import Modal from '@/components/ui/Modal';
import AddTransactionForm from '@/components/ui/AddTransactionForm';
import AddGoalForm from '@/components/ui/AddGoalForm';
import { formatCurrency } from '@/lib/constants';
import { TrendingUp, TrendingDown, Wallet, Plus, Sparkles, PiggyBank, Activity } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { transactions, analytics, fetchTransactions, fetchAnalytics, deleteTransaction } = useTransactionStore();
  const {
    budgets, insights, healthScore, gamification, subscriptions, patterns,
    fetchBudgets, fetchInsights, refreshInsights,
    fetchHealthScore, fetchGamification,
    fetchSubscriptions, detectSubscriptions,
    fetchPatterns,
  } = useFinanceStore();
  const { goals, fetchGoals } = useGoalStore();

  const [addTxOpen, setAddTxOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(() => {
    fetchTransactions({ limit: 10 });
    fetchAnalytics();
    fetchBudgets();
    fetchInsights();
    fetchGoals();
    fetchSubscriptions();

    setScoreLoading(true);
    fetchHealthScore().finally(() => setScoreLoading(false));
    fetchGamification();
    fetchPatterns();
  }, []);

  const currentIncome = analytics?.currentMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const currentExpense = analytics?.currentMonthSummary.find((s) => s._id === 'expense')?.total || 0;
  const lastIncome = analytics?.lastMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const lastExpense = analytics?.lastMonthSummary.find((s) => s._id === 'expense')?.total || 0;
  const balance = currentIncome - currentExpense;
  const savingsRate = currentIncome > 0 ? ((balance / currentIncome) * 100).toFixed(1) : '0';

  const incomeChange = lastIncome ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
  const expenseChange = lastExpense ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

  const chartData = (() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    analytics?.monthlyTrend.forEach(({ _id, total }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: `${_id.month}/${_id.year}`, income: 0, expense: 0 };
      map[key][_id.type as 'income' | 'expense'] = total;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  const handleRefreshInsights = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
  };

  const handleDetectSubs = async () => {
    setDetecting(true);
    await detectSubscriptions();
    setDetecting(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            Good {greeting},{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {user?.name?.split(' ')[0]}
            </span>{' '}
            👋
          </motion.h1>
          <p className="text-gray-500 text-sm mt-1">
            Savings rate this month:{' '}
            <span className={`font-medium ${Number(savingsRate) >= 20 ? 'text-emerald-400' : Number(savingsRate) >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
              {savingsRate}%
            </span>
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setAddTxOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-violet-500/20"
        >
          <Plus size={16} /> Add Transaction
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard
          title="Saved This Month"
          amount={Math.max(0, balance)}
          icon={<PiggyBank size={18} className="text-pink-400" />}
          gradient="bg-gradient-to-br from-pink-600 to-rose-600"
          delay={0.15}
          subtitle={`${savingsRate}% savings rate`}
        />
      </div>

      {/* Chart + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Income vs Expenses</h3>
            {patterns && (
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Activity size={12} />
                Peak: {patterns.peakSpendingDay}s
              </span>
            )}
          </div>
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
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <InsightsCard insights={insights} onRefresh={handleRefreshInsights} loading={refreshing} />
        </motion.div>
      </div>

      {/* Health Score + Gamification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <FinancialHealthScore score={healthScore} loading={scoreLoading} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GamificationCard data={gamification} />
        </motion.div>
      </div>

      {/* Transactions + Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
          transition={{ delay: 0.45 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Budget Tracker</h3>
            <a href="/profile" className="text-violet-400 text-xs hover:text-violet-300">Manage</a>
          </div>
          <BudgetProgress budgets={budgets} />
        </motion.div>
      </div>

      {/* Goals + Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GoalsTracker goals={goals} onAdd={() => setAddGoalOpen(true)} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <SubscriptionCard
            subscriptions={subscriptions}
            onDetect={handleDetectSubs}
            detecting={detecting}
          />
        </motion.div>
      </div>

      {/* Modals */}
      <Modal open={addTxOpen} onClose={() => setAddTxOpen(false)} title="Add Transaction">
        <AddTransactionForm onSuccess={() => { setAddTxOpen(false); fetchAnalytics(); fetchBudgets(); }} />
      </Modal>
      <Modal open={addGoalOpen} onClose={() => setAddGoalOpen(false)} title="Create Saving Goal">
        <AddGoalForm onSuccess={() => setAddGoalOpen(false)} />
      </Modal>
    </div>
  );
}
