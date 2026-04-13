'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useFinanceStore } from '@/store/financeStore';
import { Transaction } from '@/types';
import toast from 'react-hot-toast';

export function useSocket() {
  const { user } = useAuthStore();
  const { prependTransaction, fetchAnalytics } = useTransactionStore();
  const { fetchInsights, fetchSubscriptions } = useFinanceStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;
    if (socketRef.current?.connected) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    // Emit join on every (re)connect so room membership survives reconnects
    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('transaction:new', (tx: Transaction) => {
      prependTransaction(tx);
      fetchAnalytics();
      toast.success(
        `${tx.type === 'income' ? '💰' : '💸'} ${tx.type} ₹${tx.amount.toLocaleString()} added`,
        { duration: 3000 }
      );
    });

    socket.on('budget:warning', ({ message }: { message: string }) => {
      toast(message, { icon: '🔔', duration: 5000 });
    });

    socket.on('budget:critical', ({ message }: { message: string }) => {
      toast.error(message, { duration: 7000, icon: '🚨' });
    });

    socket.on('goal:completed', ({ message }: { message: string }) => {
      toast.success(message, { duration: 6000, icon: '🏆' });
    });

    socket.on('subscription:detected', ({ count }: { count: number }) => {
      if (count > 0) {
        toast(`🔄 ${count} subscription(s) detected`, { duration: 5000 });
        fetchSubscriptions();
      }
    });

    socket.on('ai:insight', () => {
      fetchInsights();
      toast('✨ New AI insights available', { duration: 4000 });
    });

    socket.on('connect_error', () => {
      console.warn('Socket connection failed — retrying');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]); // depend on id, not the full object reference

  return socketRef.current;
}
