'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { DatacampStatus } from '@/components/cerebro/datacamp-status'
import { CreateCurriculumDialog } from '@/components/cerebro/create-curriculum-dialog'
import {
  Brain,
  Database,
  Cpu,
  ChartLine,
  Code2,
  ChevronRight,
  Sparkles,
  Target,
  Users,
  Plus,
} from 'lucide-react'

interface Mission {
  id: string
  title: string
  status: string
  difficulty: string
  xp: number
}

interface Agent {
  id: string
  name: string
  level: number
  status: string
  activity: string
}

interface Curriculum {
  id: string
  name: string
  domain: string
  description: string
  icon: string
  color: string
  xp: number
  level: number
  missions: Mission[]
  agent: Agent | null
}

const iconMap: Record<string, any> = {
  python: Code2,
  database: Database,
  'brain-circuit': Cpu,
  'chart-line': ChartLine,
  code: Code2,
}

const domainEmojis: Record<string, string> = {
  python: 'PY',
  sql: 'SQL',
  'ai-engineering': 'AI',
  'data-science': 'DS',
  'web-dev': 'WEB',
}

export function DashboardView() {
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const openCurriculum = useUI((s) => s.openCurriculum)
  const openAgents = useUI((s) => s.openAgents)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/curricula')
      const data = await res.json()
      setCurricula(data.curricula || [])
    } finally {
      setLoading(false)
    }
  }

  const totalAgents = curricula.filter((c) => c.agent).length
  const totalMissions = curricula.reduce((sum, c) => sum + c.missions.length, 0)
  const completedMissions = curricula.reduce(
    (sum, c) => sum + c.missions.filter((m) => m.status === 'completed').length,
    0
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* DataCamp status banner */}
      <DatacampStatus />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900 via-zinc-900/50 to-zinc-950 p-6 md:p-8">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">
              Bienvenue dans votre monde virtuel
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 max-w-3xl">
            Chaque cours que vous révisez devient une mission.
            <br />
            <span className="text-zinc-500">Chaque cursus terminé devient un agent-mémoire.</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Collez un lien DataCamp, une URL de cours ou vos notes. Mnemo génère un
            défi de codage style GTA spécifique au chapitre étudié. Complétez les
            missions pour gagner de l'XP et donner naissance à des agents-mémoires
            - votre mémoire virtuelle dans chaque domaine, que vous pouvez réveiller
            à tout moment pour réviser.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Cursus actifs" value={curricula.length} icon={<Brain className="w-4 h-4" />} />
            <StatBox label="Missions générées" value={totalMissions} icon={<Target className="w-4 h-4" />} />
            <StatBox label="Missions complétées" value={completedMissions} icon={<Sparkles className="w-4 h-4" />} />
            <StatBox label="Agents nés" value={totalAgents} icon={<Users className="w-4 h-4" />} />
          </div>
        </div>
      </section>

      {/* Curricula grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Territoires</h2>
            <p className="text-xs text-zinc-500">
              Cliquez un territoire pour soumettre un cours ou voir les missions
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau cursus
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6 h-48 animate-pulse bg-zinc-900/40 border-zinc-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curricula.map((c) => (
              <CurriculumCard key={c.id} curriculum={c} onOpen={() => openCurriculum(c.id)} />
            ))}
            {/* Add new curriculum card */}
            <button
              onClick={() => setCreateOpen(true)}
              className="group text-left w-full"
            >
              <Card className="border-dashed border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-emerald-500/40 transition-all p-5 h-full flex items-center justify-center min-h-[180px]">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                    <Plus className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-xs text-zinc-500 group-hover:text-zinc-300">
                    Créer un cursus personnalisé
                  </p>
                </div>
              </Card>
            </button>
          </div>
        )}
      </section>

      {/* Agents preview */}
      {totalAgents > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Vos agents actifs</h2>
              <p className="text-xs text-zinc-500">
                Cliquez pour discuter avec votre futur vous
              </p>
            </div>
            <button
              onClick={openAgents}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curricula
              .filter((c) => c.agent)
              .map((c) => (
                <AgentMiniCard key={c.agent!.id} curriculum={c} onOpen={() => useUI.getState().openAgentChat(c.agent!.id)} />
              ))}
          </div>
        </section>
      )}

      <CreateCurriculumDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-2 text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums text-zinc-100">{value}</div>
    </div>
  )
}

function CurriculumCard({ curriculum, onOpen }: { curriculum: Curriculum; onOpen: () => void }) {
  const Icon = iconMap[curriculum.icon] || Code2
  const completedMissions = curriculum.missions.filter((m) => m.status === 'completed').length
  const totalMissions = curriculum.missions.length
  const xpForNextLevel = curriculum.level * 500
  const xpProgress = (curriculum.xp % 500) / 5 // 0-100

  // Agent unlocked at level 3
  const agentUnlocked = curriculum.level >= 3

  return (
    <button
      onClick={onOpen}
      className="group text-left w-full"
    >
      <Card className="relative overflow-hidden border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all hover:border-zinc-700 p-5 h-full">
        {/* Color stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: curriculum.color, opacity: 0.8 }}
        />
        {/* Glow */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: curriculum.color }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${curriculum.color}20`,
                  border: `1px solid ${curriculum.color}40`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: curriculum.color }} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100">{curriculum.name}</h3>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Niveau {curriculum.level}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
            {curriculum.description}
          </p>

          {/* XP progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>{curriculum.xp} XP</span>
              <span>{xpForNextLevel} XP</span>
            </div>
            <Progress value={xpProgress} className="h-1.5 bg-zinc-800" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <Target className="w-3 h-3" />
              <span>{completedMissions}/{totalMissions} missions</span>
            </div>
            {curriculum.agent ? (
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                <Users className="w-2.5 h-2.5 mr-1" /> {curriculum.agent.name}
              </Badge>
            ) : agentUnlocked ? (
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                <Sparkles className="w-2.5 h-2.5 mr-1" /> Naissance imminente
              </Badge>
            ) : (
              <Badge className="bg-zinc-800/50 text-zinc-500 border-zinc-700/50">
                Niveau 3 requis
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </button>
  )
}

function AgentMiniCard({ curriculum, onOpen }: { curriculum: Curriculum; onOpen: () => void }) {
  const agent = curriculum.agent!
  return (
    <button onClick={onOpen} className="group text-left w-full">
      <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-zinc-950 font-bold text-xs">
            {domainEmojis[curriculum.domain]?.slice(0, 2).toUpperCase() || 'AG'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100">{agent.name}</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px]">
                Lv {agent.level}
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-400 truncate">{agent.activity}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </button>
  )
}
