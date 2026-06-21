// Global UI state for navigation between views
import { create } from 'zustand'

export type ViewName =
  | 'dashboard'      // Carte fantasy interactive
  | 'virtual-world'  // Monde 2D Phaser
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

  goDashboard: () => void
  openVirtualWorld: () => void
  openAgents: () => void
  openMissions: () => void
  openReviews: () => void
  openAchievements: () => void
  openSettings: () => void
  openCurriculum: (id: string) => void
  openMission: (id: string, curriculumId?: string) => void
  openAgentChat: (id: string) => void
}

export const useUI = create<UIState>((set) => ({
  view: 'dashboard',
  activeCurriculumId: null,
  activeMissionId: null,
  activeAgentId: null,

  goDashboard: () => set({ view: 'dashboard' }),
  openVirtualWorld: () => set({ view: 'virtual-world' }),
  openAgents: () => set({ view: 'agents' }),
  openMissions: () => set({ view: 'missions' }),
  openReviews: () => set({ view: 'reviews' }),
  openAchievements: () => set({ view: 'achievements' }),
  openSettings: () => set({ view: 'settings' }),
  openCurriculum: (id) => set({ view: 'curriculum', activeCurriculumId: id }),
  openMission: (id, curriculumId) =>
    set((s) => ({
      view: 'mission',
      activeMissionId: id,
      activeCurriculumId: curriculumId ?? s.activeCurriculumId,
    })),
  openAgentChat: (id) => set({ view: 'agent-chat', activeAgentId: id }),
}))
