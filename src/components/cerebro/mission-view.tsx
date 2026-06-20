'use client'

import { useEffect, useState, useRef } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Target,
  Loader2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  Code2,
  Trophy,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Mission {
  id: string
  title: string
  briefing: string
  objectives: string
  starterCode: string
  hint: string
  difficulty: string
  xp: number
  status: string
  language: string
  sourceContent: string
  curriculum: {
    name: string
    color: string
    domain: string
  }
  submissions: { id: string; passed: boolean; createdAt: string }[]
}

interface Evaluation {
  passed: boolean
  feedback: string
  score: number
}

export function MissionView() {
  const missionId = useUI((s) => s.activeMissionId)
  const openCurriculum = useUI((s) => s.openCurriculum)
  const activeCurriculumId = useUI((s) => s.activeCurriculumId)

  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [missionCompleted, setMissionCompleted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!missionId) {
      openCurriculum(activeCurriculumId || '')
      return
    }
    refresh()
  }, [missionId])

  async function refresh() {
    if (!missionId) return
    setLoading(true)
    setEvaluation(null)
    setMissionCompleted(false)
    try {
      const res = await fetch(`/api/missions/${missionId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMission(data.mission)
      setCode(data.mission.starterCode || '')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!missionId || !code.trim()) return
    setSubmitting(true)
    setEvaluation(null)
    try {
      const res = await fetch(`/api/missions/${missionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEvaluation(data.evaluation)
      if (data.missionCompleted) {
        setMissionCompleted(true)
        toast.success(`Mission complétée! +${mission?.xp} XP`)
      } else if (data.evaluation.passed) {
        toast.success('Mission validée')
      } else {
        toast.error('Mission non validée. Voir le feedback.')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Tab key in code editor for indentation
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newValue)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 mb-4">Mission introuvable</p>
        <Button onClick={() => openCurriculum(activeCurriculumId || '')} variant="outline">
          Retour au cursus
        </Button>
      </div>
    )
  }

  const objectives: string[] = JSON.parse(mission.objectives)
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

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button
        onClick={() => openCurriculum(activeCurriculumId || '')}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour au cursus
      </button>

      {/* Mission briefing card - GTA style */}
      <Card
        className="relative overflow-hidden p-6 border-zinc-700"
        style={{
          background: `linear-gradient(135deg, ${mission.curriculum.color}15 0%, rgba(24, 24, 27, 0.6) 50%)`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: mission.curriculum.color }}
        />
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: mission.curriculum.color }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" style={{ color: mission.curriculum.color }} />
            <span
              className="text-[10px] uppercase tracking-[0.2em] font-semibold"
              style={{ color: mission.curriculum.color }}
            >
              Briefing de mission · {mission.curriculum.name}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {mission.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={`${difficultyColor[mission.difficulty]}`}>
                {difficultyLabel[mission.difficulty]}
              </Badge>
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                <Trophy className="w-3 h-3 mr-1" />
                {mission.xp} XP
              </Badge>
              {mission.status === 'completed' && (
                <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Validée
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm md:text-base text-zinc-200 leading-relaxed italic mb-5">
            &ldquo;{mission.briefing}&rdquo;
          </p>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              Objectifs
            </div>
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{
                      backgroundColor: `${mission.curriculum.color}20`,
                      color: mission.curriculum.color,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Code editor */}
      <Card className="border-zinc-800/60 bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-zinc-400 font-mono">
              solution.{mission.language === 'Python' ? 'py' : mission.language === 'SQL' ? 'sql' : 'js'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {mission.language}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="w-full h-80 p-4 bg-transparent text-zinc-100 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder:text-zinc-700"
          placeholder="Écrivez votre code ici..."
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold h-11"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Évaluation en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Soumettre le code
            </>
          )}
        </Button>
        <Button
          onClick={() => setShowHint(!showHint)}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800/50 h-11"
        >
          <Lightbulb className="w-4 h-4 mr-2 text-amber-400" />
          {showHint ? "Cacher l'indice" : 'Indice'}
        </Button>
      </div>

      {/* Hint */}
      {showHint && mission.hint && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">
                Indice
              </div>
              <p className="text-sm text-zinc-300">{mission.hint}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Evaluation */}
      {evaluation && (
        <Card
          className={`p-5 border-2 ${
            evaluation.passed
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-rose-500/40 bg-rose-500/5'
          }`}
        >
          <div className="flex items-start gap-3">
            {evaluation.passed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className={`font-bold ${evaluation.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {evaluation.passed ? 'Mission validée' : 'Mission non validée'}
                </h3>
                <Badge
                  className={
                    evaluation.passed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }
                >
                  Score: {evaluation.score}/100
                </Badge>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{evaluation.feedback}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Mission completed banner */}
      {missionCompleted && (
        <Card className="p-6 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-amber-500/5 text-center">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="font-bold text-lg mb-1">Mission complétée !</h3>
          <p className="text-sm text-zinc-400 mb-4">
            +{mission.xp} XP gagnés dans le cursus {mission.curriculum.name}
          </p>
          <Button
            onClick={() => openCurriculum(activeCurriculumId || '')}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
          >
            Continuer
          </Button>
        </Card>
      )}

      {/* Source content (collapsible) */}
      {mission.sourceContent && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Voir le cours source qui a généré cette mission
          </summary>
          <Card className="mt-2 p-3 bg-zinc-950/50 border-zinc-800/60">
            <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
              {mission.sourceContent}
            </pre>
          </Card>
        </details>
      )}
    </div>
  )
}
