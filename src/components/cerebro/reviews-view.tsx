'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/cerebro/empty-state'
import {
  ArrowLeft,
  Brain,
  Clock,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Calendar,
  TrendingUp,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatInterval } from '@/lib/spaced-repetition'

interface ReviewMission {
  id: string
  title: string
  briefing: string
  difficulty: string
  xp: number
  language: string
  reviewCount: number
  lastReviewAt: string | null
  nextReviewAt: string | null
  curriculum: { name: string; color: string; domain: string }
  objectives: string[]
}

interface UpcomingReview {
  id: string
  title: string
  nextReviewAt: string
  curriculum: { name: string; color: string }
}

interface ReviewStats {
  dueCount: number
  upcomingCount: number
  totalReviewed: number
}

type Rating = 'again' | 'hard' | 'good' | 'easy'

const RATING_CONFIG: Record<Rating, { label: string; color: string; icon: any; xp: number }> = {
  again: { label: 'À revoir', color: 'border-rose-500/40 hover:bg-rose-500/10 text-rose-300', icon: RotateCcw, xp: 10 },
  hard: { label: 'Difficile', color: 'border-amber-500/40 hover:bg-amber-500/10 text-amber-300', icon: AlertCircle, xp: 15 },
  good: { label: 'Correct', color: 'border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300', icon: CheckCircle2, xp: 25 },
  easy: { label: 'Facile', color: 'border-blue-500/40 hover:bg-blue-500/10 text-blue-300', icon: Zap, xp: 35 },
}

export function ReviewsView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const openMission = useUI((s) => s.openMission)
  const [dueMissions, setDueMissions] = useState<ReviewMission[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingReview[]>([])
  const [stats, setStats] = useState<ReviewStats>({ dueCount: 0, upcomingCount: 0, totalReviewed: 0 })
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews')
      const data = await res.json()
      setDueMissions(data.due || [])
      setUpcoming(data.upcoming || [])
      setStats(data.stats || { dueCount: 0, upcomingCount: 0, totalReviewed: 0 })
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(missionId: string, rating: Rating) {
    setReviewingId(missionId)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, rating }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Révision enregistrée +${data.reviewXp} XP`)
      // Remove from due list
      setDueMissions((prev) => prev.filter((m) => m.id !== missionId))
      setStats((prev) => ({ ...prev, dueCount: prev.dueCount - 1 }))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button
        onClick={goDashboard}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la carte
      </button>

      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Brain className="w-6 h-6 text-emerald-400" />
          Révisions espacées
        </h1>
        <p className="text-sm text-zinc-400">
          Algorithme FSRS — révisez au moment optimal pour ancrer durablement vos acquis
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">À réviser</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-300">{stats.dueCount}</div>
        </Card>
        <Card className="p-4 border-blue-500/30 bg-blue-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">7 prochains jours</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-blue-300">{stats.upcomingCount}</div>
        </Card>
        <Card className="p-4 border-purple-500/30 bg-purple-500/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">Déjà révisées</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-purple-300">{stats.totalReviewed}</div>
        </Card>
      </div>

      {/* Due missions */}
      <div>
        <h2 className="font-bold text-lg mb-3">Missions à réviser maintenant</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : dueMissions.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="Aucune révision due"
            description="Vous êtes à jour ! Revenez plus tard ou complétez de nouvelles missions pour générer des cartes de révision."
            action={
              <Button onClick={goDashboard} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950">
                Explorer les cursus
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {dueMissions.map((m) => (
              <ReviewCard
                key={m.id}
                mission={m}
                reviewing={reviewingId === m.id}
                onReview={(rating) => handleReview(m.id, rating)}
                onOpen={() => openMission(m.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming reviews */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3">Prochaines révisions (7 jours)</h2>
          <Card className="p-4 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
            <div className="space-y-2">
              {upcoming.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: u.curriculum.color }}
                    />
                    <span className="text-zinc-300 truncate">{u.title}</span>
                    <span className="text-[10px] text-zinc-500">{u.curriculum.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 flex-shrink-0">
                    {formatInterval(new Date(u.nextReviewAt))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function ReviewCard({
  mission,
  reviewing,
  onReview,
  onOpen,
}: {
  mission: ReviewMission
  reviewing: boolean
  onReview: (rating: Rating) => void
  onOpen: () => void
}) {
  const difficultyColor: Record<string, string> = {
    rookie: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/50',
    pro: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    elite: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  }

  return (
    <Card className="p-5 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: mission.curriculum.color }}
            />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {mission.curriculum.name}
            </span>
            <Badge className={`${difficultyColor[mission.difficulty]} text-[9px]`}>
              {mission.difficulty}
            </Badge>
            {mission.reviewCount > 0 && (
              <span className="text-[10px] text-zinc-600">
                · Révisée {mission.reviewCount}×
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm cursor-pointer hover:text-emerald-300" onClick={onOpen}>
            {mission.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 italic line-clamp-2">"{mission.briefing}"</p>
        </div>
      </div>

      {/* Review buttons */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {(Object.keys(RATING_CONFIG) as Rating[]).map((rating) => {
          const config = RATING_CONFIG[rating]
          const Icon = config.icon
          return (
            <button
              key={rating}
              onClick={() => onReview(rating)}
              disabled={reviewing}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${config.color} disabled:opacity-50`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{config.label}</span>
              <span className="text-[9px] opacity-60">+{config.xp} XP</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
