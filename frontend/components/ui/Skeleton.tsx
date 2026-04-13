'use client';
import { motion } from 'framer-motion';

const pulse = {
  animate: { opacity: [0.4, 0.8, 0.4] as number[] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
};

export function SkeletonBox({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      {...pulse}
      style={style}
      className={`bg-white/8 rounded-xl ${className}`}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="w-9 h-9 rounded-xl" />
      </div>
      <SkeletonBox className="h-8 w-32 mb-2" />
      <SkeletonBox className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTransactionRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-3 w-40" />
        <SkeletonBox className="h-2.5 w-24" />
      </div>
      <SkeletonBox className="h-4 w-16" />
    </div>
  );
}

export function SkeletonTransactionList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTransactionRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <SkeletonBox className="h-4 w-36 mb-4" />
      <SkeletonBox className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}

export function SkeletonInsightCard() {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="w-5 h-5 rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/3 space-y-2">
            <SkeletonBox className="h-3 w-32" />
            <SkeletonBox className="h-2.5 w-full" />
            <SkeletonBox className="h-2.5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHealthScore() {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <SkeletonBox className="h-4 w-40 mb-4" />
      <div className="flex items-center gap-6">
        <SkeletonBox className="w-32 h-32 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <SkeletonBox className="h-2.5 w-24" />
                <SkeletonBox className="h-2.5 w-10" />
              </div>
              <SkeletonBox className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
