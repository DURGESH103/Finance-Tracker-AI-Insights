'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvestmentStore } from '@/store/investmentStore';
import { Investment } from '@/types';
import { formatCurrency } from '@/lib/constants';
import { Plus, TrendingUp, TrendingDown, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const TYPE_META: Record<string, { icon: string; color: string }> = {
  stock:       { icon: '📈', color: 'text-blue-400' },
  crypto:      { icon: '₿',  color: 'text-yellow-400' },
  mutual_fund: { icon: '🏦', color: 'text-violet-400' },
  fd:          { icon: '🔒', color: 'text-green-400' },
  gold:        { icon: '🥇', color: 'text-yellow-500' },
  other:       { icon: '💼', color: 'text-gray-400' },
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function AddInvestmentModal({ onClose }: { onClose: () => void }) {
  const { addInvestment } = useInvestmentStore();
  const [form, setForm] = useState({
    name: '', type: 'stock', symbol: '', units: '', buyPrice: '', currentPrice: '', buyDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.units || !form.buyPrice) return toast.error('Fill required fields');
    setLoading(true);
    try {
      await addInvestment({
        name: form.name, type: form.type as Investment['type'],
        symbol: form.symbol || undefined,
        units: Number(form.units), buyPrice: Number(form.buyPrice),
        currentPrice: form.currentPrice ? Number(form.currentPrice) : undefined,
        buyDate: form.buyDate,
      });
      toast.success('Investment added!');
      onClose();
    } catch { toast.error('Failed to add'); }
    finally { setLoading(false); }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Add Investment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(['stock','crypto','mutual_fund','fd','gold','other'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${form.type === t ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-white/5 bg-white/3 text-gray-500 hover:border-white/20'}`}>
                <span>{TYPE_META[t].icon}</span>
                <span className="capitalize">{t.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
          <input type="text" placeholder="Name (e.g. Reliance Industries)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
          <input type="text" placeholder="Symbol (optional, e.g. RELIANCE)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Units / Qty" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className={inputCls} required />
            <input type="number" placeholder="Buy Price (₹)" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} className={inputCls} required />
          </div>
          <input type="number" placeholder="Current Price (₹) — optional" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} className={inputCls} />
          <input type="date" value={form.buyDate} onChange={(e) => setForm({ ...form, buyDate: e.target.value })} className={inputCls} />
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Investment'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function InvestmentsPage() {
  const { investments, portfolio, loading, fetchInvestments, deleteInvestment } = useInvestmentStore();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { fetchInvestments(); }, []);

  const pieData = Object.entries(
    investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investments</h1>
          <p className="text-gray-500 text-sm mt-1">Track your portfolio performance</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Add Investment
        </motion.button>
      </div>

      {/* Portfolio summary */}
      {portfolio && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Invested', value: portfolio.totalInvested, color: 'text-white' },
            { label: 'Current Value', value: portfolio.currentValue, color: 'text-white' },
            { label: 'Total P&L', value: portfolio.pnl, color: portfolio.pnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Returns', value: null, display: `${portfolio.pnlPct}%`, color: Number(portfolio.pnlPct) >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(({ label, value, display, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>
                {display || formatCurrency(value!)}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Allocation pie */}
        {pieData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(Number(v)), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-400 text-xs capitalize">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="text-gray-300 text-xs">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Holdings list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className={`bg-white/5 border border-white/8 rounded-2xl p-5 ${pieData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-white font-semibold text-sm mb-4">Holdings</h3>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
          ) : !investments.length ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No investments tracked yet</p>
              <button onClick={() => setAddOpen(true)} className="text-violet-400 text-xs mt-1 hover:text-violet-300">Add your first investment →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {investments.map((inv, i) => {
                const meta = TYPE_META[inv.type];
                const isProfit = inv.pnl >= 0;
                return (
                  <motion.div key={inv._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 bg-white/3 rounded-xl hover:bg-white/5 border border-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium truncate">{inv.name}</p>
                        {inv.symbol && <span className="text-gray-500 text-xs bg-white/5 px-1.5 py-0.5 rounded">{inv.symbol}</span>}
                      </div>
                      <p className="text-gray-500 text-xs">{inv.units} units @ {formatCurrency(inv.buyPrice)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-sm font-semibold">{formatCurrency(inv.currentValue)}</p>
                      <div className={`flex items-center justify-end gap-0.5 text-xs ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isProfit ? '+' : ''}{formatCurrency(inv.pnl)} ({inv.pnlPct}%)
                      </div>
                    </div>
                    <button onClick={() => { deleteInvestment(inv._id); toast.success('Removed'); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-1">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {addOpen && <AddInvestmentModal onClose={() => { setAddOpen(false); fetchInvestments(); }} />}
      </AnimatePresence>
    </div>
  );
}
