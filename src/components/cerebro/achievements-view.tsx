'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Trophy,
  Lock,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react'

interface Achievement {
  code: string
  title: string
  description: string
  icon: string
  color: string
  category: string
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
  progress: { current: number; target: number } | null
}

interface AchievementStats {
  completedMissions: number
  agentsCount: number
  curriculaCount: number
  maxLevel: number
  streak: number
  agentChats: number
  datacampSynced: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  missions: 'Missions',
  streak: 'Séries',
  agents: 'Agents',
  exploration: 'Exploration',
  mastery: 'Maîtrise',
}

const CATEGORY_ORDER = ['missions', 'streak', 'agents', 'exploration', 'mastery']

export function AchievementsView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/achievements')
      const data = await res.json()
      setAchievements(data.achievements || [])
      setStats(data.stats || null)
    } finally {
      setLoading(false)
    }
  }

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)
  const totalXp = unlocked.reduce((sum, a) => sum + a.xpReward, 0)
  const completionRate = achievements.length > 0
    ? Math.round((unlocked.length / achievements.length) * 100)
    : 0

  // Group by category
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    achievements: achievements.filter((a) => a.category === cat),
  })).filter((g) => g.achievements.length > 0)

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
        <h1 className="text-2xl font-bold mb-1">Trophées & succès</h1>
        <p className="text-sm text-zinc-400">
          Débloquez des badges en progressant dans votre apprentissage
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Débloqués</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-300">
            {unlocked.length}<span className="text-sm text-zinc-500">/{achievements.length}</span>
          </div>
        </Card>
        <Card className="p-4 border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">XP bonus</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-amber-300">{totalXp}</div>
        </Card>
        <Card className="p-4 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Complétion</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-zinc-100">{completionRate}%</div>
        </Card>
        <Card className="p-4 border-purple-500/30 bg-purple-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Restants</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-purple-300">{locked.length}</div>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : (
        byCategory.map((group) => (
          <div key={group.category}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-bold text-sm">{group.label}</h2>
              <Badge className="bg-white/5 text-zinc-400 border-white/10 text-[9px]">
                {group.achievements.filter((a) => a.unlocked).length}/{group.achievements.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.achievements.map((achievement) => (
                <AchievementCard key={achievement.code} achievement={achievement} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { unlocked, icon, color, title, description, xpReward, progress } = achievement
  const progressPct = progress && progress.target > 0
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : 0

  return (
    <Card
      className={`relative overflow-hidden p-4 backdrop-blur-xl transition-all ${
        unlocked
          ? 'border-white/20 bg-zinc-900/60 hover:scale-[1.02]'
          : 'border-white/5 bg-zinc-950/40 opacity-70 hover:opacity-100'
      }`}
      style={unlocked ? { borderColor: `${color}40`, boxShadow: `0 0 20px ${color}10` } : undefined}
    >
      {unlocked && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="relative flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
            unlocked ? '' : 'grayscale opacity-50'
          }`}
          style={{
            backgroundColor: unlocked ? `${color}20` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${unlocked ? `${color}40` : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {unlocked ? icon : <Lock className="w-5 h-5 text-zinc-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-sm ${unlocked ? 'text-zinc-100' : 'text-zinc-400'}`}>
              {title}
            </h3>
            {unlocked && (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            )}
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-2">{description}</p>
          <div className="flex items-center gap-2">
            <Badge className={`text-[9px] ${unlocked ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-white/5 text-zinc-500 border-white/10'}`}>
              +{xpReward} XP
            </Badge>
            {unlocked && achievement.unlockedAt && (
              <span className="text-[9px] text-zinc-600">
                {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
          {!unlocked && progress && progress.target > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-zinc-600">
                <span>{progress.current}/{progress.target}</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-1 bg-zinc-800" />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
