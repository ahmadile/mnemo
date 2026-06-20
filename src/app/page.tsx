'use client'

import { useEffect } from 'react'
import { useUI } from '@/store/ui'
import { DashboardView } from '@/components/cerebro/dashboard-view'
import { CurriculumView } from '@/components/cerebro/curriculum-view'
import { MissionView } from '@/components/cerebro/mission-view'
import { AgentsView } from '@/components/cerebro/agents-view'
import { AgentChatView } from '@/components/cerebro/agent-chat-view'
import { WorldView } from '@/components/cerebro/world-view'
import { VirtualWorldView } from '@/components/cerebro/virtual-world-view'
import { HudSidebar } from '@/components/cerebro/hud-sidebar'
import { HudTopbar } from '@/components/cerebro/hud-topbar'

export default function Home() {
  const view = useUI((s) => s.view)

  // Scroll to top on view change (except for virtual-world which manages its own scroll)
  useEffect(() => {
    if (view !== 'virtual-world') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex flex-1">
        <HudSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <HudTopbar />
          <div className={`flex-1 ${view === 'virtual-world' ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
            {view === 'dashboard' && <DashboardView />}
            {view === 'curriculum' && <CurriculumView />}
            {view === 'mission' && <MissionView />}
            {view === 'agents' && <AgentsView />}
            {view === 'agent-chat' && <AgentChatView />}
            {view === 'world' && <WorldView />}
            {view === 'virtual-world' && <VirtualWorldView />}
          </div>
        </main>
      </div>
    </div>
  )
}
