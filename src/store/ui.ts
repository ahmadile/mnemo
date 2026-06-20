// Global UI state for navigation between views (no persistence needed beyond session)
import { create } from 'zustand'

export type ViewName =
  | 'dashboard'
  | 'curriculum'      // curriculum detail (with submit course form + mission list)
  | 'mission'         // active mission (briefing + code editor)
  | 'agents'          // agent gallery
  | 'agent-chat'      // chat with one agent
  | 'world'           // "Monde des Agents" SVG visualization (agents + communications)
  | 'virtual-world'   // 2D top-down RPG simulation with avatars and chat bubbles

interface UIState {
  view: ViewName
  activeCurriculumId: string | null
  activeMissionId: string | null
  activeAgentId: string | null

  // navigation actions
  goDashboard: () => void
  openCurriculum: (id: string) => void
  openMission: (id: string, curriculumId?: string) => void
  openAgents: () => void
  openAgentChat: (id: string) => void
  openWorld: () => void
  openVirtualWorld: () => void
}

export const useUI = create<UIState>((set) => ({
  view: 'dashboard',
  activeCurriculumId: null,
  activeMissionId: null,
  activeAgentId: null,

  goDashboard: () => set({ view: 'dashboard' }),
  openCurriculum: (id) => set({ view: 'curriculum', activeCurriculumId: id }),
  openMission: (id, curriculumId) =>
    set((s) => ({
      view: 'mission',
      activeMissionId: id,
      activeCurriculumId: curriculumId ?? s.activeCurriculumId,
    })),
  openAgents: () => set({ view: 'agents' }),
  openAgentChat: (id) => set({ view: 'agent-chat', activeAgentId: id }),
  openWorld: () => set({ view: 'world' }),
  openVirtualWorld: () => set({ view: 'virtual-world' }),
}))
