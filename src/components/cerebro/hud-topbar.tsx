'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Brain, Users, Zap, Menu } from 'lucide-react'

interface Stats {
  totalXp: number
  agentCount: number
  missionCount: number
}

export function HudTopbar() {
  const view = useUI((s) => s.view)
  const [stats, setStats] = useState<Stats>({ totalXp: 0, agentCount: 0, missionCount: 0 })

  const refresh = useCallback(async () => {
    try {
      const [curriculaRes, agentsRes] = await Promise.all([
        fetch('/api/curricula'),
        fetch('/api/agents'),
      ])
      const curriculaData = await curriculaRes.json()
      const agentsData = await agentsRes.json()
      const curricula = curriculaData.curricula || []
      const agents = agentsData.agents || []
      const totalXp = curricula.reduce((sum: number, c: any) => sum + (c.xp || 0), 0)
      const missionCount = curricula.reduce(
        (sum: number, c: any) => sum + (c.missions?.length || 0),
        0
      )
      setStats({ totalXp, agentCount: agents.length, missionCount })
    } catch (e) {
      // silent
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [view, refresh])

  const viewTitle: Record<string, string> = {
    dashboard: 'CARTE DU MONDE',
    curriculum: 'Cursus',
    mission: 'Mission en cours',
    agents: 'Vos agents virtuels',
    'agent-chat': 'Conversation',
  }

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-zinc-100">
              {viewTitle[view] || 'CEREBRO'}
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">
              {view === 'dashboard' && "Vue d'ensemble"}
              {view === 'curriculum' && 'Détails du cursus'}
              {view === 'mission' && 'Briefing & éditeur'}
              {view === 'agents' && 'Galerie'}
              {view === 'agent-chat' && 'Chat mémoire'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <StatChip icon={<Zap className="w-3.5 h-3.5" />} label="XP" value={stats.totalXp} color="amber" />
          <StatChip icon={<Users className="w-3.5 h-3.5" />} label="Agents" value={stats.agentCount} color="emerald" />
          <div className="hidden sm:block">
            <StatChip icon={<Brain className="w-3.5 h-3.5" />} label="Missions" value={stats.missionCount} color="zinc" />
          </div>
        </div>
      </div>
    </header>
  )
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'amber' | 'emerald' | 'zinc'
}) {
  const colorMap = {
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    zinc: 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300',
  }
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${colorMap[color]}`}
    >
      <span className="opacity-80">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-xs font-bold tabular-nums">{value}</span>
      </div>
    </div>
  )
}
