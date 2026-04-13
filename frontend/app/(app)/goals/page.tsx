'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGoalStore } from '@/store/goalStore';
import { formatCurrency } from '@/lib/constants';
import { Plus, Flame, Trophy, Target, Calendar, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import AddGoalForm from '@/components/ui/AddGoalForm';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const { goals, loading, fetchGoals, deleteGoal, contribute } = useGoalStore();
  const [addOpen, setAddOpen] = useState(false);
  const [contributing, setContributing] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => { fetchGoals(); }, []);

  const active = goals.filter((g) => !g.completed);
  const completed = goals.filter((g) => g.completed);

  const handleContribute = async (id: string) => {
    if (!amount || isNaN(Number(amount))) return toast.error('Enter valid amount');
    await contribute(id, Number(amount));
    toast.success('Contribution added!');
    setContributing(null);
    setAmount('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Saving Goals</h1>
          <p className="text-gray-500 text-sm mt-1">{active.length} active · {completed.length} completed</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> New Goal
        </motion.button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : !goals.length ? (
        <div className="text-center py-20">
          <Target size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No goals yet</p>
          <p className="text-gray-600 text-sm mt-1">Set a saving goal to start building wealth</p>
          <button onClick={() => setAddOpen(true)} className="mt-4 text-violet-400 hover:text-violet-300 text-sm">
            Create your first goal →
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((goal, i) => {
                  const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                  const remaining = goal.targetAmount - goal.savedAmount;
                  const isContributing = contributing === goal._id;

                  return (
                    <motion.div key={goal._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="bg-white/5 border border-white/8 rounded-2xl p-5 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                            {goal.icon}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{goal.title}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                              {goal.streak > 0 && (
                                <span className="flex items-center gap-1 text-orange-400 text-xs">
                                  <Flame size={12} /> {goal.streak}d streak
                                </span>
                              )}
                              {goal.deadline && (
                                <span className="flex items-center gap-1 text-gray-500 text-xs">
                                  <Calendar size={11} /> {format(new Date(goal.deadline), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteGoal(goal._id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-gray-400 text-xs">{formatCurrency(goal.savedAmount)} saved</span>
                          <span className="text-gray-400 text-xs">{formatCurrency(goal.targetAmount)} goal</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-violet-400 text-xs font-medium">{pct.toFixed(1)}%</span>
                          <span className="text-gray-500 text-xs">{formatCurrency(remaining)} remaining</span>
                        </div>
                      </div>

                      {/* Contribute */}
                      {isContributing ? (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                            <input
                              type="number" placeholder="Amount" value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleContribute(goal._id)}
                              className="w-full bg-white/5 border border-violet-500 rounded-xl pl-7 pr-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => handleContribute(goal._id)}
                            className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-xl text-sm transition-colors">
                            Add
                          </button>
                          <button onClick={() => { setContributing(null); setAmount(''); }}
                            className="bg-white/5 text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-white/10 transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setContributing(goal._id)}
                          className="w-full py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-sm font-medium transition-colors border border-violet-500/20">
                          + Add Funds
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completed.map((goal, i) => (
                  <motion.div key={goal._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-2xl">{goal.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{goal.title}</h3>
                        <Trophy size={14} className="text-yellow-400" />
                      </div>
                      <p className="text-yellow-400 text-xs mt-0.5">{formatCurrency(goal.targetAmount)} — Goal achieved! 🎉</p>
                    </div>
                    <button onClick={() => deleteGoal(goal._id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create Saving Goal">
        <AddGoalForm onSuccess={() => { setAddOpen(false); fetchGoals(); }} />
      </Modal>
    </div>
  );
}
