'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Brain, Users, Zap, Target } from 'lucide-react'
import { ThemeToggle } from '@/components/cerebro/theme-toggle'

interface Stats {
  totalXp: number
  agentCount: number
  missionCount: number
  completedMissions: number
}

export function HudTopbar() {
  const view = useUI((s) => s.view)
  const [stats, setStats] = useState<Stats>({
    totalXp: 0,
    agentCount: 0,
    missionCount: 0,
    completedMissions: 0,
  })

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
      let missionCount = 0
      let completedMissions = 0
      curricula.forEach((c: any) => {
        const missions = c.missions || []
        missionCount += missions.length
        completedMissions += missions.filter((m: any) => m.status === 'completed').length
      })
      setStats({ totalXp, agentCount: agents.length, missionCount, completedMissions })
    } catch (e) {
      // silent
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [view, refresh])

  const viewTitle: Record<string, string> = {
    dashboard: 'CARTE DU MONDE',
    curriculum: 'CURSUS',
    mission: 'MISSION EN COURS',
    agents: 'AGENTS',
    'agent-chat': 'CONVERSATION',
    'virtual-world': 'MONDE VIRTUEL 2D',
    playground: 'PLAYGROUND',
    missions: 'MISSIONS',
    reviews: 'RÉVISIONS',
    achievements: 'TROPHÉES',
    settings: 'RÉGLAGES',
  }

  const viewSubtitle: Record<string, string> = {
    dashboard: "Vue d'ensemble du monde",
    curriculum: 'Détails du cursus',
    mission: 'Briefing & éditeur',
    agents: 'Vos moi virtuels',
    'agent-chat': 'Chat mémoire',
    'virtual-world': 'Simulation RPG',
    playground: 'Outils d\'apprentissage interactifs',
    missions: 'Toutes vos missions',
    reviews: 'Spaced repetition (FSRS)',
    achievements: 'Badges & succès',
    settings: 'Profil & configuration',
  }

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-4 pl-14 md:pl-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-wider text-zinc-100 truncate">
              {viewTitle[view] || 'MNEMO'}
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">
              {viewSubtitle[view] || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <StatChip icon={<Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="XP" value={stats.totalXp} color="amber" />
          <div className="hidden sm:flex">
            <StatChip icon={<Users className="w-3.5 h-3.5" />} label="Agents" value={stats.agentCount} color="emerald" />
          </div>
          <div className="hidden md:flex">
            <StatChip icon={<Target className="w-3.5 h-3.5" />} label={`${stats.completedMissions}/${stats.missionCount}`} color="zinc" />
          </div>
          <ThemeToggle />
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
  label: string | number
  value?: number
  color: 'amber' | 'emerald' | 'zinc'
}) {
  const colorMap = {
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    zinc: 'border-zinc-700/50 bg-zinc-800/40 text-zinc-300',
  }
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm ${colorMap[color]}`}
    >
      <span className="opacity-80">{icon}</span>
      <div className="flex flex-col leading-none">
        {typeof label === 'string' && value !== undefined ? (
          <>
            <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
            <span className="text-xs font-bold tabular-nums">{value}</span>
          </>
        ) : (
          <span className="text-xs font-bold tabular-nums">{label}</span>
        )}
      </div>
    </div>
  )
}
