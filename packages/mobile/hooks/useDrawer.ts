import { create } from 'zustand'

/**
 * Global open/close state for the role drawer, so any screen (Home, operator
 * dashboard, manager dashboard) can open the same root-level drawer.
 */
interface DrawerState {
  open: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

export const useDrawer = create<DrawerState>((set) => ({
  open: false,
  openDrawer: () => set({ open: true }),
  closeDrawer: () => set({ open: false }),
}))
