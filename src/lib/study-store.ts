import { create } from "zustand";

export type StudyMode = "normal" | "reverse";

interface StudyState {
  reveal: 0 | 1 | 2; // 0 = chinese, 1 = + pinyin, 2 = + english
  mode: StudyMode;
  index: number;
  setReveal: (r: 0 | 1 | 2) => void;
  nextReveal: () => void;
  reset: () => void;
  setMode: (m: StudyMode) => void;
  advance: () => void;
  setIndex: (i: number) => void;
}

export const useStudy = create<StudyState>((set) => ({
  reveal: 0,
  mode: "normal",
  index: 0,
  setReveal: (r) => set({ reveal: r }),
  nextReveal: () => set((s) => ({ reveal: s.reveal < 2 ? ((s.reveal + 1) as 0 | 1 | 2) : 2 })),
  reset: () => set({ reveal: 0 }),
  setMode: (m) => set({ mode: m, reveal: 0, index: 0 }),
  advance: () => set((s) => ({ index: s.index + 1, reveal: 0 })),
  setIndex: (i) => set({ index: i, reveal: 0 }),
}));