import { useEffect, useState } from 'react';
import { isOnline, pendingCount, subscribeOutbox } from '../data/outbox.js';

export function useOnline() {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
export function useOutboxCount() {
  const [n, setN] = useState(pendingCount());
  useEffect(() => subscribeOutbox(() => setN(pendingCount())), []);
  return n;
}
