'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeftRight, BarChart3, Bot, User, Wallet, Target, TrendingUp, Calculator, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useFinanceStore } from '@/store/financeStore';

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/analytics',    icon: BarChart3,       label: 'Analytics' },
  { href: '/investments',  icon: TrendingUp,      label: 'Investments' },
  { href: '/goals',        icon: Target,          label: 'Goals' },
  { href: '/simulator',    icon: Calculator,      label: 'Simulator' },
  { href: '/ai',           icon: Bot,             label: 'AI Assistant' },
  { href: '/profile',      icon: User,            label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { risks } = useFinanceStore();
  const criticalRisks = risks.filter((r) => r.severity === 'critical' || r.severity === 'high').length;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0f0f14] border-r border-white/5 px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">FinTrack</span>
        <span className="ml-auto text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded font-medium">v2</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-violet-500/15 text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
                {active && <motion.div layoutId="sidebar-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </motion.div>
            </Link>
          );
        })}

        {/* Risk alert badge */}
        {criticalRisks > 0 && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mt-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-red-400 text-sm font-medium">{criticalRisks} Risk Alert{criticalRisks > 1 ? 's' : ''}</span>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors text-xs">Out</button>
        </div>
      </div>
    </aside>
  );
}
