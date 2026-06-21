'use client'

import { useUI, ViewName } from '@/store/ui'
import { Brain, Map, Gamepad2, Users, Target, Settings, Trophy, RefreshCw, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: { id: ViewName; label: string; icon: any; desc: string }[] = [
  { id: 'dashboard', label: 'Carte', icon: Map, desc: 'Monde & cursus' },
  { id: 'virtual-world', label: 'Monde 2D', icon: Gamepad2, desc: 'Simulation RPG' },
  { id: 'agents', label: 'Agents', icon: Users, desc: 'Vos moi virtuels' },
  { id: 'missions', label: 'Missions', icon: Target, desc: 'Toutes vos missions' },
  { id: 'reviews', label: 'Révisions', icon: RefreshCw, desc: 'Spaced repetition' },
  { id: 'achievements', label: 'Trophées', icon: Trophy, desc: 'Badges & succès' },
  { id: 'settings', label: 'Réglages', icon: Settings, desc: 'Profil & config' },
]

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const view = useUI((s) => s.view)
  const goDashboard = useUI((s) => s.goDashboard)
  const openVirtualWorld = useUI((s) => s.openVirtualWorld)
  const openAgents = useUI((s) => s.openAgents)
  const openMissions = useUI((s) => s.openMissions)
  const openReviews = useUI((s) => s.openReviews)
  const openAchievements = useUI((s) => s.openAchievements)
  const openSettings = useUI((s) => s.openSettings)

  const handleClick = (id: ViewName) => {
    if (id === 'dashboard') goDashboard()
    else if (id === 'virtual-world') openVirtualWorld()
    else if (id === 'agents') openAgents()
    else if (id === 'missions') openMissions()
    else if (id === 'reviews') openReviews()
    else if (id === 'achievements') openAchievements()
    else if (id === 'settings') openSettings()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={cn('p-4 border-b border-white/5', collapsed && 'px-3')}>
        <button
          onClick={goDashboard}
          className="flex items-center gap-3 group w-full"
          title={collapsed ? 'MNEMO' : undefined}
        >
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-emerald-500/40 blur-lg rounded-full group-hover:bg-emerald-400/50 transition-colors" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Brain className="w-5 h-5 text-zinc-950" />
            </div>
          </div>
          {!collapsed && (
            <div className="text-left min-w-0">
              <h1 className="font-bold text-base tracking-tight text-zinc-50">MNEMO</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                v1.9 · mind.net
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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
                'w-full flex items-center gap-3 rounded-xl transition-all text-left group relative',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                active
                  ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-200 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && !collapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r" />
              )}
              <div className={cn(
                'rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
                collapsed ? 'w-8 h-8' : 'w-8 h-8',
                active
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/5 text-zinc-500 group-hover:text-zinc-300'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                    {item.desc}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom card */}
      {!collapsed && (
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
      )}
    </div>
  )
}

export function HudSidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggleSidebar = useUI((s) => s.toggleSidebar)
  const mobileSidebarOpen = useUI((s) => s.mobileSidebarOpen)
  const setMobileSidebar = useUI((s) => s.setMobileSidebar)

  return (
    <>
      {/* Desktop sidebar (collapsible) */}
      <aside
        className={cn(
          'hidden md:flex relative flex-col border-r border-white/5 bg-zinc-950/60 backdrop-blur-xl transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent collapsed={collapsed} />
        {/* Collapse toggle button — fixed at vertical center, outside the sidebar */}
        <button
          onClick={toggleSidebar}
          className="absolute top-20 -right-3 z-50 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:scale-110 transition-all shadow-lg"
          title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          {collapsed ? <PanelLeftOpen className="w-3 h-3 text-zinc-400" /> : <PanelLeftClose className="w-3 h-3 text-zinc-400" />}
        </button>
      </aside>

      {/* Mobile hamburger button (in topbar area) */}
      <button
        onClick={() => setMobileSidebar(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-lg bg-zinc-900/80 backdrop-blur border border-white/10 flex items-center justify-center text-zinc-300"
        title="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-white/5 z-50 transition-transform duration-300"
        style={{ transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <button
          onClick={() => setMobileSidebar(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent collapsed={false} />
      </aside>
    </>
  )
}
