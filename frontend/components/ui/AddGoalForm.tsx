'use client';
import { useState } from 'react';
import { useGoalStore } from '@/store/goalStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💍', '📱', '🎓', '💰', '🏋️', '🌴'];

interface Props {
  onSuccess: () => void;
}

export default function AddGoalForm({ onSuccess }: Props) {
  const { addGoal } = useGoalStore();
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    icon: '🎯',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.targetAmount) return toast.error('Fill in required fields');
    setLoading(true);
    try {
      await addGoal({
        title: form.title,
        targetAmount: Number(form.targetAmount),
        deadline: form.deadline || undefined,
        icon: form.icon,
      });
      toast.success('Goal created!');
      onSuccess();
    } catch {
      toast.error('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Icon picker */}
      <div>
        <p className="text-gray-400 text-xs mb-2">Choose Icon</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm({ ...form, icon })}
              className={`w-10 h-10 rounded-xl text-xl transition-all ${
                form.icon === icon
                  ? 'bg-violet-500/20 border border-violet-500'
                  : 'bg-white/5 border border-white/5 hover:border-white/20'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Goal title (e.g. Emergency Fund)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className={inputCls}
        required
      />

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
        <input
          type="number"
          placeholder="Target amount"
          value={form.targetAmount}
          onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
          className={`${inputCls} pl-8`}
          required
        />
      </div>

      <input
        type="date"
        value={form.deadline}
        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        className={inputCls}
      />

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Goal'}
      </motion.button>
    </form>
  );
}
