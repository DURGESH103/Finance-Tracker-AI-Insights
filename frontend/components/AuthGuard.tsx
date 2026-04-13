'use client';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token && pathname !== '/login' && pathname !== '/register') {
      router.replace('/login');
    }
  }, [token, pathname]);

  if (!token && pathname !== '/login' && pathname !== '/register') return null;
  return <>{children}</>;
}
