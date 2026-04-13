'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval, startOfWeek, getDay } from 'date-fns';

interface HeatmapDay {
  date: string;
  count: number;
  total: number;
}

interface Props {
  data: HeatmapDay[];
  weeks?: number;
}

const getIntensity = (count: number, max: number): number => {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
};

const INTENSITY_COLORS = [
  'bg-white/5',           // 0 — empty
  'bg-violet-900/60',     // 1 — low
  'bg-violet-700/70',     // 2 — medium
  'bg-violet-500/80',     // 3 — high
  'bg-violet-400',        // 4 — peak
];

const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function ActivityHeatmap({ data, weeks = 26 }: Props) {
  const { grid, months } = useMemo(() => {
    const today = new Date();
    const start = subDays(today, weeks * 7 - 1);
    const days = eachDayOfInterval({ start, end: today });

    const dataMap = new Map(data.map((d) => [d.date, d]));
    const max = Math.max(...data.map((d) => d.count), 1);

    // Build week columns
    const cols: { date: Date; count: number; total: number; intensity: number }[][] = [];
    let currentWeek: typeof cols[0] = [];

    // Pad start to Sunday
    const startDow = getDay(start);
    for (let i = 0; i < startDow; i++) {
      currentWeek.push({ date: new Date(0), count: 0, total: 0, intensity: -1 });
    }

    days.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const d = dataMap.get(key);
      currentWeek.push({
        date: day,
        count: d?.count || 0,
        total: d?.total || 0,
        intensity: d ? getIntensity(d.count, max) : 0,
      });
      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length) cols.push(currentWeek);

    // Month labels
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    cols.forEach((week, i) => {
      const firstReal = week.find((d) => d.intensity !== -1);
      if (firstReal && firstReal.date.getTime() !== new Date(0).getTime()) {
        const m = firstReal.date.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ label: format(firstReal.date, 'MMM'), col: i });
          lastMonth = m;
        }
      }
    });

    return { grid: cols, months: monthLabels };
  }, [data, weeks]);

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Transaction Activity</h3>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0.5">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DOW_LABELS.map((label, i) => (
              <div key={i} className="h-3 w-6 flex items-center">
                <span className="text-gray-600 text-[9px]">{label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col">
            {/* Month labels */}
            <div className="flex gap-0.5 mb-1 h-3 relative">
              {grid.map((_, colIdx) => {
                const ml = months.find((m) => m.col === colIdx);
                return (
                  <div key={colIdx} className="w-3 relative">
                    {ml && (
                      <span className="absolute text-[9px] text-gray-500 whitespace-nowrap">{ml.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cells */}
            <div className="flex gap-0.5">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => {
                    if (day.intensity === -1) return <div key={di} className="w-3 h-3" />;
                    return (
                      <motion.div
                        key={di}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (wi * 7 + di) * 0.001 }}
                        title={
                          day.count > 0
                            ? `${format(day.date, 'MMM d, yyyy')}: ${day.count} txn(s), ₹${day.total.toLocaleString()}`
                            : format(day.date, 'MMM d, yyyy')
                        }
                        className={`w-3 h-3 rounded-sm cursor-default transition-all hover:ring-1 hover:ring-violet-400 ${INTENSITY_COLORS[day.intensity]}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-gray-600 text-[10px]">Less</span>
        {INTENSITY_COLORS.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-gray-600 text-[10px]">More</span>
      </div>
    </div>
  );
}
