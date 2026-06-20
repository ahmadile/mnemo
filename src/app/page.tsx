'use client'

import { useEffect } from 'react'
import { useUI } from '@/store/ui'
import { DashboardView } from '@/components/cerebro/dashboard-view'
import { CurriculumView } from '@/components/cerebro/curriculum-view'
import { MissionView } from '@/components/cerebro/mission-view'
import { AgentsView } from '@/components/cerebro/agents-view'
import { AgentChatView } from '@/components/cerebro/agent-chat-view'
import { HudSidebar } from '@/components/cerebro/hud-sidebar'
import { HudTopbar } from '@/components/cerebro/hud-topbar'

export default function Home() {
  const view = useUI((s) => s.view)

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex flex-1">
        <HudSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <HudTopbar />
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {view === 'dashboard' && <DashboardView />}
            {view === 'curriculum' && <CurriculumView />}
            {view === 'mission' && <MissionView />}
            {view === 'agents' && <AgentsView />}
            {view === 'agent-chat' && <AgentChatView />}
          </div>
        </main>
      </div>
    </div>
  )
}
