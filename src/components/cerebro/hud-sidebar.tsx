'use client'

import { useUI, ViewName } from '@/store/ui'
import { Brain, Map, Gamepad2, Users, Target, Settings, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: { id: ViewName; label: string; icon: any; desc: string }[] = [
  { id: 'dashboard', label: 'Carte', icon: Map, desc: 'Monde & cursus' },
  { id: 'virtual-world', label: 'Monde 2D', icon: Gamepad2, desc: 'Simulation RPG' },
  { id: 'agents', label: 'Agents', icon: Users, desc: 'Vos moi virtuels' },
  { id: 'missions', label: 'Missions', icon: Target, desc: 'Toutes vos missions' },
  { id: 'achievements', label: 'Trophées', icon: Trophy, desc: 'Badges & succès' },
  { id: 'settings', label: 'Réglages', icon: Settings, desc: 'Profil & config' },
]

export function HudSidebar() {
  const view = useUI((s) => s.view)
  const goDashboard = useUI((s) => s.goDashboard)
  const openVirtualWorld = useUI((s) => s.openVirtualWorld)
  const openAgents = useUI((s) => s.openAgents)
  const openMissions = useUI((s) => s.openMissions)
  const openAchievements = useUI((s) => s.openAchievements)
  const openSettings = useUI((s) => s.openSettings)

  const handleClick = (id: ViewName) => {
    if (id === 'dashboard') goDashboard()
    else if (id === 'virtual-world') openVirtualWorld()
    else if (id === 'agents') openAgents()
    else if (id === 'missions') openMissions()
    else if (id === 'achievements') openAchievements()
    else if (id === 'settings') openSettings()
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-zinc-950/60 backdrop-blur-xl">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-white/5">
        <button
          onClick={goDashboard}
          className="flex items-center gap-3 group w-full"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/40 blur-lg rounded-full group-hover:bg-emerald-400/50 transition-colors" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Brain className="w-5 h-5 text-zinc-950" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="font-bold text-base tracking-tight text-zinc-50">MNEMO</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              v1.4 · mind.net
            </p>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = view === item.id ||
            (item.id === 'agents' && view === 'agent-chat') ||
            (item.id === 'dashboard' && view === 'curriculum') ||
            (item.id === 'missions' && view === 'mission')
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative overflow-hidden',
                active
                  ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-200 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
              )}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r" />
              )}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                active
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/5 text-zinc-500 group-hover:text-zinc-300'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                  {item.desc}
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Bottom card */}
      <div className="p-3 border-t border-white/5">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-amber-500/5 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
              Astuce
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Capturez vos cours DataCamp avec l'extension Chrome pour générer des missions automatiquement.
          </p>
        </div>
      </div>
    </aside>
  )
}
