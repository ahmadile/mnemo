'use client'

import { useUI } from '@/store/ui'
import { Brain, Map, Code2, Users, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'dashboard' as const, label: 'Carte', icon: Home, desc: 'Vue du monde' },
  { id: 'agents' as const, label: 'Agents', icon: Users, desc: 'Vos moi virtuels' },
]

export function HudSidebar() {
  const view = useUI((s) => s.view)
  const goDashboard = useUI((s) => s.goDashboard)
  const openAgents = useUI((s) => s.openAgents)

  const handleClick = (id: 'dashboard' | 'agents') => {
    if (id === 'dashboard') goDashboard()
    else openAgents()
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800/60 bg-zinc-900/40 backdrop-blur">
      <div className="p-6 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 blur-lg rounded-full" />
            <Brain className="relative w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">CEREBRO</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              v1.0 · mind.net
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-left group',
                active
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                  {item.desc}
                </div>
              </div>
              {active && <div className="w-1 h-6 rounded-full bg-emerald-400" />}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800/60">
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
              Astuce
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Soumettez vos notes de cours. L'IA générera une mission style GTA
            spécifique au chapitre étudié.
          </p>
        </div>
      </div>
    </aside>
  )
}
