import { create } from 'zustand';

import { todayIso } from '@/lib/date';

interface DateState {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
}

export const useDateStore = create<DateState>((set) => ({
  selectedDate: todayIso(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
