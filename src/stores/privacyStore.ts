import { create } from 'zustand'

interface PrivacyStore {
  peeked: boolean
  togglePeek: () => void
  hidePeek: () => void
}

export const usePrivacyStore = create<PrivacyStore>((set) => ({
  peeked: false,
  togglePeek: () => set((state) => ({ peeked: !state.peeked })),
  hidePeek: () => set({ peeked: false }),
}))
