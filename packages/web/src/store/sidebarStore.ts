import { create } from 'zustand'

/**
 * Whether the desktop sidebar is pinned open. Shared between the sidebar (which reads/toggles it)
 * and the layouts (which reserve left padding for the expanded width when pinned, the collapsed
 * width when not). Persisted so the operator's choice survives a reload.
 */
const STORAGE_KEY = 'tripavail-sidebar-pinned'

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

interface SidebarState {
  pinned: boolean
  togglePinned: () => void
  setPinned: (value: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  pinned: readInitial(),
  togglePinned: () =>
    set((state) => {
      const next = !state.pinned
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore storage failures (private mode)
      }
      return { pinned: next }
    }),
  setPinned: (value: boolean) =>
    set(() => {
      try {
        localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
      } catch {
        // ignore
      }
      return { pinned: value }
    }),
}))
