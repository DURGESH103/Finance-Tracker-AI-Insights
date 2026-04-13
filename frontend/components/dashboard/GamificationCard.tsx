'use client';
import { motion } from 'framer-motion';
import { Gamification } from '@/types';
import { Flame, Zap, Star } from 'lucide-react';

interface Props {
  data: Gamification | null;
}

export default function GamificationCard({ data }: Props) {
  if (!data) return null;

  const earnedIds = new Set(data.earnedBadges.map((b) => b.badgeId));
  const xpToNext = 100 - (data.points % 100);
  const xpPct = ((data.points % 100) / 100) * 100;

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <Star size={16} className="text-yellow-400" /> Achievements
      </h3>

      {/* Level + Streak row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white/3 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{data.level}</div>
          <div className="text-gray-500 text-[10px] mt-0.5">Level</div>
        </div>
        <div className="flex-1 bg-white/3 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={16} className="text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">{data.currentStreak}</span>
          </div>
          <div className="text-gray-500 text-[10px] mt-0.5">Day Streak</div>
        </div>
        <div className="flex-1 bg-white/3 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">{data.points}</span>
          </div>
          <div className="text-gray-500 text-[10px] mt-0.5">Points</div>
        </div>
      </div>

      {/* XP bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-gray-500 text-[10px]">Level {data.level}</span>
          <span className="text-gray-500 text-[10px]">{xpToNext} XP to Level {data.level + 1}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
          />
        </div>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-4 gap-2">
        {data.allBadges.map((badge, i) => {
          const earned = earnedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              title={`${badge.label}: ${badge.desc}`}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-default ${
                earned
                  ? 'border-yellow-500/30 bg-yellow-500/10'
                  : 'border-white/5 bg-white/3 opacity-40 grayscale'
              }`}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-[9px] text-center text-gray-400 leading-tight">{badge.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
