'use client';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  // Wait one tick for Zustand persist to rehydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login');
    }
  }, [hydrated, token, pathname]);

  // Avoid rendering protected content before rehydration is confirmed
  if (!hydrated) return null;
  if (!token && !PUBLIC_PATHS.includes(pathname)) return null;

  return <>{children}</>;
}
