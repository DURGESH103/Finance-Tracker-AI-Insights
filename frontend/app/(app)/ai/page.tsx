'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useFinanceStore } from '@/store/financeStore';
import { useTransactionStore } from '@/store/transactionStore';
import { ChatMessage } from '@/types';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Where did I spend most money this month?',
  'How can I save more?',
  'Am I on track with my budget?',
  'What is my biggest expense category?',
  'Give me a savings plan for next month',
  'How does my spending compare to last month?',
];

export default function AIPage() {
  const { insights, fetchInsights, refreshInsights } = useFinanceStore();
  const { analytics, fetchAnalytics } = useTransactionStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your AI finance assistant powered by GPT. I have full context of your spending, budgets, and goals. Ask me anything! 💰" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentIncome = analytics?.currentMonthSummary.find((s) => s._id === 'income')?.total || 0;
  const currentExpense = analytics?.currentMonthSummary.find((s) => s._id === 'expense')?.total || 0;

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai/chat', { message: text, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      toast.error('AI assistant unavailable');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
    toast.success('Insights refreshed!');
  };

  return (
    <div className="flex h-screen max-h-screen overflow-hidden">
      {/* Chat area */}
      <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Finance Assistant</h1>
              <p className="text-gray-500 text-xs">Powered by GPT-3.5 · Knows your finances</p>
            </div>
          </div>
        </div>

        {/* Context bar */}
        {(currentIncome > 0 || currentExpense > 0) && (
          <div className="flex gap-3 mb-4 flex-shrink-0">
            {[
              { label: 'Income', value: currentIncome, color: 'text-emerald-400' },
              { label: 'Expenses', value: currentExpense, color: 'text-red-400' },
              { label: 'Savings', value: currentIncome - currentExpense, color: currentIncome >= currentExpense ? 'text-violet-400' : 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-center">
                <p className="text-gray-500 text-[10px]">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{formatCurrency(value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant' ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-white/10'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-white/5 border border-white/8 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-xs bg-white/5 border border-white/10 text-gray-300 hover:border-violet-500 hover:text-violet-300 px-3 py-1.5 rounded-xl transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 flex-shrink-0">
          <input
            type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about your finances..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors">
            <Send size={16} className="text-white" />
          </motion.button>
        </div>
      </div>

      {/* Insights sidebar — desktop only */}
      <div className="hidden xl:flex flex-col w-80 border-l border-white/5 p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            AI Insights
          </h3>
          <button onClick={handleRefresh} disabled={refreshing}
            className="text-gray-500 hover:text-violet-400 transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {!insights.length ? (
          <p className="text-gray-500 text-xs text-center py-4">Click refresh to generate insights</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const colors = {
                warning: 'border-red-500/20 bg-red-500/5',
                tip: 'border-yellow-500/20 bg-yellow-500/5',
                prediction: 'border-violet-500/20 bg-violet-500/5',
                summary: 'border-blue-500/20 bg-blue-500/5',
              };
              const icons = { warning: '⚠️', tip: '💡', prediction: '🔮', summary: '📊' };
              return (
                <div key={insight._id} className={`p-3 rounded-xl border ${colors[insight.type]}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">{icons[insight.type]}</span>
                    <div>
                      <p className="text-white text-xs font-semibold mb-0.5">{insight.title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed">{insight.text}</p>
                      {insight.savingsAmount && (
                        <p className="text-emerald-400 text-xs mt-1 font-medium">Save ₹{insight.savingsAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
