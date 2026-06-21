// Global UI state for navigation between views
import { create } from 'zustand'

export type ViewName =
  | 'dashboard'      // Carte fantasy interactive
  | 'virtual-world'  // Monde 2D Phaser
  | 'playground'     // Outils d'apprentissage interactifs
  | 'agents'         // Galerie d'agents
  | 'missions'       // Toutes les missions (tous cursus)
  | 'reviews'        // Révisions espacées (FSRS)
  | 'achievements'   // Badges et trophées
  | 'settings'       // Réglages
  | 'curriculum'     // Détail d'un cursus (depuis la carte)
  | 'mission'        // Mission en cours
  | 'agent-chat'     // Chat avec un agent

interface UIState {
  view: ViewName
  activeCurriculumId: string | null
  activeMissionId: string | null
  activeAgentId: string | null
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean

  goDashboard: () => void
  openVirtualWorld: () => void
  openPlayground: () => void
  openAgents: () => void
  openMissions: () => void
  openReviews: () => void
  openAchievements: () => void
  openSettings: () => void
  openCurriculum: (id: string) => void
  openMission: (id: string, curriculumId?: string) => void
  openAgentChat: (id: string) => void
  toggleSidebar: () => void
  setMobileSidebar: (open: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  view: 'dashboard',
  activeCurriculumId: null,
  activeMissionId: null,
  activeAgentId: null,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,

  goDashboard: () => set({ view: 'dashboard', mobileSidebarOpen: false }),
  openVirtualWorld: () => set({ view: 'virtual-world', mobileSidebarOpen: false }),
  openPlayground: () => set({ view: 'playground', mobileSidebarOpen: false }),
  openAgents: () => set({ view: 'agents', mobileSidebarOpen: false }),
  openMissions: () => set({ view: 'missions', mobileSidebarOpen: false }),
  openReviews: () => set({ view: 'reviews', mobileSidebarOpen: false }),
  openAchievements: () => set({ view: 'achievements', mobileSidebarOpen: false }),
  openSettings: () => set({ view: 'settings', mobileSidebarOpen: false }),
  openCurriculum: (id) => set({ view: 'curriculum', activeCurriculumId: id, mobileSidebarOpen: false }),
  openMission: (id, curriculumId) =>
    set((s) => ({
      view: 'mission',
      activeMissionId: id,
      activeCurriculumId: curriculumId ?? s.activeCurriculumId,
      mobileSidebarOpen: false,
    })),
  openAgentChat: (id) => set({ view: 'agent-chat', activeAgentId: id, mobileSidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
}))
