'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  Loader2,
  Trophy,
  Filter,
} from 'lucide-react'

interface Mission {
  id: string
  title: string
  status: string
  difficulty: string
  xp: number
  language: string
  createdAt: string
  curriculum: {
    name: string
    color: string
    domain: string
  }
}

export function MissionsView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const openMission = useUI((s) => s.openMission)
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/missions')
      const data = await res.json()
      setMissions(data.missions || [])
    } finally {
      setLoading(false)
    }
  }

  const filteredMissions = missions.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'active') return m.status !== 'completed'
    return m.status === 'completed'
  })

  const completedCount = missions.filter((m) => m.status === 'completed').length
  const totalXpEarned = missions
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + m.xp, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <button
        onClick={goDashboard}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la carte
      </button>

      <div>
        <h1 className="text-2xl font-bold mb-1">Toutes vos missions</h1>
        <p className="text-sm text-zinc-400">
          Historique complet des missions générées dans tous les cursus.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{missions.length}</div>
        </Card>
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Complétées</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-300">{completedCount}</div>
        </Card>
        <Card className="p-4 border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">XP gagnée</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-amber-300">{totalXpEarned}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-zinc-500" />
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'Toutes' : f === 'active' ? 'En cours' : 'Complétées'}
          </button>
        ))}
      </div>

      {/* Mission list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card className="p-8 border-dashed border-zinc-800 bg-zinc-900/20 text-center backdrop-blur-xl">
          <Target className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-1">
            {filter === 'all' && 'Aucune mission pour l\'instant'}
            {filter === 'active' && 'Aucune mission en cours'}
            {filter === 'completed' && 'Aucune mission complétée'}
          </p>
          <p className="text-xs text-zinc-600">
            Soumettez un cours depuis un cursus pour générer votre première mission
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMissions.map((m) => (
            <MissionRow
              key={m.id}
              mission={m}
              onOpen={() => openMission(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MissionRow({ mission, onOpen }: { mission: Mission; onOpen: () => void }) {
  const difficultyColor: Record<string, string> = {
    rookie: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/50',
    pro: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    elite: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  }
  const difficultyLabel: Record<string, string> = {
    rookie: 'Recrue',
    pro: 'Pro',
    elite: 'Élite',
  }
  const isCompleted = mission.status === 'completed'

  return (
    <button onClick={onOpen} className="w-full group text-left">
      <Card className="p-4 border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-1 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: isCompleted ? '#10B981' : mission.curriculum.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{mission.title}</h3>
                {isCompleted && (
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[9px]">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Validée
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: mission.curriculum.color }}
                >
                  {mission.curriculum.name}
                </span>
                <Badge className={`${difficultyColor[mission.difficulty]} text-[9px]`}>
                  {difficultyLabel[mission.difficulty]}
                </Badge>
                <span className="text-[10px] text-zinc-500 font-mono">{mission.language}</span>
                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[9px]">
              <Trophy className="w-2.5 h-2.5 mr-1" />
              {mission.xp} XP
            </Badge>
          </div>
        </div>
      </Card>
    </button>
  )
}
