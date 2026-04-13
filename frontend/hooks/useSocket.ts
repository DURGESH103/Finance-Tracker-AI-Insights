'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { Transaction } from '@/types';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const { user } = useAuthStore();
  const { prependTransaction } = useTransactionStore();
  const joined = useRef(false);

  useEffect(() => {
    if (!user || joined.current) return;

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, { transports: ['websocket'] });
    socket.emit('join', user.id);
    joined.current = true;

    socket.on('transaction:new', (tx: Transaction) => {
      prependTransaction(tx);
      toast.success(`New ${tx.type}: ₹${tx.amount}`);
    });

    socket.on('budget:alert', (msg: string) => {
      toast.error(msg, { duration: 5000 });
    });

    return () => {
      socket?.disconnect();
      joined.current = false;
    };
  }, [user]);

  return socket;
}
