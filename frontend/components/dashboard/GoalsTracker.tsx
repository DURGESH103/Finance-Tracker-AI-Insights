'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoalStore } from '@/store/goalStore';
import { Goal } from '@/types';
import { formatCurrency } from '@/lib/constants';
import { Plus, Flame, Trophy, Trash2, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface ContributeModalProps {
  goal: Goal;
  onClose: () => void;
}

function ContributeModal({ goal, onClose }: ContributeModalProps) {
  const { contribute } = useGoalStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);
    try {
      await contribute(goal._id, Number(amount));
      toast.success(`₹${Number(amount).toLocaleString()} added to ${goal.title}!`);
      onClose();
    } catch {
      toast.error('Failed to contribute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-sm z-10"
      >
        <div className="text-center mb-5">
          <span className="text-4xl">{goal.icon}</span>
          <h3 className="text-white font-semibold mt-2">{goal.title}</h3>
          <p className="text-gray-400 text-sm">
            {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              placeholder="Amount to add"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Funds'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface Props {
  goals: Goal[];
  onAdd: () => void;
}

export default function GoalsTracker({ goals, onAdd }: Props) {
  const { deleteGoal } = useGoalStore();
  const [contributing, setContributing] = useState<Goal | null>(null);

  return (
    <>
      <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Target size={16} className="text-violet-400" /> Saving Goals
          </h3>
          <button
            onClick={onAdd}
            className="w-7 h-7 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 flex items-center justify-center transition-colors"
          >
            <Plus size={14} className="text-violet-400" />
          </button>
        </div>

        {!goals.length ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No goals yet</p>
            <button onClick={onAdd} className="text-violet-400 text-xs mt-1 hover:text-violet-300">
              Create your first goal →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal, i) => {
              const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
              const remaining = goal.targetAmount - goal.savedAmount;
              return (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-white/3 rounded-xl border border-white/5 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{goal.icon}</span>
                      <div>
                        <p className="text-white text-xs font-medium">{goal.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {goal.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-orange-400 text-[10px]">
                              <Flame size={10} /> {goal.streak}d
                            </span>
                          )}
                          {goal.completed && (
                            <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                              <Trophy size={10} /> Done!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!goal.completed && (
                        <button
                          onClick={() => setContributing(goal)}
                          className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-md hover:bg-violet-500/30 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                      <button onClick={() => deleteGoal(goal._id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${goal.completed ? 'bg-yellow-400' : 'bg-violet-500'}`}
                    />
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400 text-[10px]">{formatCurrency(goal.savedAmount)} saved</span>
                    <span className="text-gray-500 text-[10px]">
                      {goal.completed ? '🎉 Completed!' : `${formatCurrency(remaining)} left`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {contributing && (
          <ContributeModal goal={contributing} onClose={() => setContributing(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
