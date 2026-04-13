'use client';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import { useSocket } from '@/hooks/useSocket';

function SocketInit() {
  useSocket();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SocketInit />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
