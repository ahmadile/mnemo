'use client'

import { useEffect } from 'react'
import { useUI } from '@/store/ui'
import { DashboardView } from '@/components/cerebro/dashboard-view'
import { CurriculumView } from '@/components/cerebro/curriculum-view'
import { MissionView } from '@/components/cerebro/mission-view'
import { AgentsView } from '@/components/cerebro/agents-view'
import { AgentChatView } from '@/components/cerebro/agent-chat-view'
import { VirtualWorldView } from '@/components/cerebro/virtual-world-view'
import { PlaygroundView } from '@/components/cerebro/playground-view'
import { MissionsView } from '@/components/cerebro/missions-view'
import { ReviewsView } from '@/components/cerebro/reviews-view'
import { AchievementsView } from '@/components/cerebro/achievements-view'
import { SettingsView } from '@/components/cerebro/settings-view'
import { HudSidebar } from '@/components/cerebro/hud-sidebar'
import { HudTopbar } from '@/components/cerebro/hud-topbar'

export default function Home() {
  const view = useUI((s) => s.view)

  useEffect(() => {
    if (view !== 'virtual-world') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  const fullScreenViews = ['virtual-world']

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex flex-1 relative">
        <HudSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <HudTopbar />
          <div className={`flex-1 ${fullScreenViews.includes(view) ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
            {view === 'dashboard' && <DashboardView />}
            {view === 'curriculum' && <CurriculumView />}
            {view === 'mission' && <MissionView />}
            {view === 'agents' && <AgentsView />}
            {view === 'agent-chat' && <AgentChatView />}
            {view === 'virtual-world' && <VirtualWorldView />}
            {view === 'playground' && <PlaygroundView />}
            {view === 'missions' && <MissionsView />}
            {view === 'reviews' && <ReviewsView />}
            {view === 'achievements' && <AchievementsView />}
            {view === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  )
}
