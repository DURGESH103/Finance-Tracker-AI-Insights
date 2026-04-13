'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, BarChart3, Bot, User, TrendingUp, Target } from 'lucide-react';

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Txns' },
  { href: '/analytics',    icon: BarChart3,       label: 'Stats' },
  { href: '/investments',  icon: TrendingUp,      label: 'Invest' },
  { href: '/goals',        icon: Target,          label: 'Goals' },
  { href: '/ai',           icon: Bot,             label: 'AI' },
  { href: '/profile',      icon: User,            label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f14]/95 backdrop-blur border-t border-white/5 flex overflow-x-auto">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 gap-0.5 min-w-[52px]">
            <Icon size={18} className={active ? 'text-violet-400' : 'text-gray-500'} />
            <span className={`text-[9px] ${active ? 'text-violet-400' : 'text-gray-500'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
