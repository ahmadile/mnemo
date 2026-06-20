'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Code2,
  Database,
  Cpu,
  ChartLine,
  Target,
  Loader2,
  Sparkles,
  CheckCircle2,
  Send,
  Link2,
  Download,
  FileText,
  Youtube,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

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

export function CurriculumView() {
  const curriculumId = useUI((s) => s.activeCurriculumId)
  const goDashboard = useUI((s) => s.goDashboard)
  const openMission = useUI((s) => s.openMission)

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(true)

  // Submit course form state
  const [courseContent, setCourseContent] = useState('')
  const [courseLink, setCourseLink] = useState('')
  const [generating, setGenerating] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedTitle, setExtractedTitle] = useState<string | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [showYoutube, setShowYoutube] = useState(false)

  useEffect(() => {
    if (!curriculumId) {
      goDashboard()
      return
    }
    refresh()
  }, [curriculumId])

  async function refresh() {
    if (!curriculumId) return
    setLoading(true)
    try {
      const res = await fetch('/api/curricula')
      const data = await res.json()
      const c = (data.curricula || []).find((c: Curriculum) => c.id === curriculumId)
      setCurriculum(c || null)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateMission() {
    if (!curriculumId) return
    if (courseContent.trim().length < 10) {
      toast.error('Le contenu du cours doit faire au moins 10 caractères')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumId,
          courseContent: courseContent.trim(),
          courseLink: courseLink.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération')
      toast.success(`Mission générée: ${data.mission.title}`)
      setCourseContent('')
      setCourseLink('')
      setExtractedTitle(null)
      await refresh()
      // Open the new mission
      openMission(data.mission.id, curriculumId)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleExtractUrl() {
    if (!courseLink.trim()) {
      toast.error('Collez une URL d\'abord')
      return
    }
    if (!courseLink.startsWith('http')) {
      toast.error('URL invalide')
      return
    }
    setExtracting(true)
    setExtractedTitle(null)
    try {
      const res = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: courseLink.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction impossible')
      if (!data.content || data.content.length < 50) {
        throw new Error('Contenu extrait trop court ou vide')
      }
      // Truncate to reasonable length for the LLM
      const truncated = data.content.slice(0, 6000)
      setCourseContent(truncated)
      setExtractedTitle(data.title || null)
      toast.success(
        `Contenu extrait${data.title ? ` : ${data.title}` : ''} (${data.contentLength} caractères)`
      )
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setExtracting(false)
    }
  }

  async function handleYouTube() {
    if (!youtubeUrl.trim()) {
      toast.error('Collez une URL YouTube')
      return
    }
    setYoutubeLoading(true)
    setExtractedTitle(null)
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction impossible')
      if (!data.transcript || data.transcript.length < 50) {
        throw new Error('Transcription trop courte ou vide')
      }
      setCourseContent(data.transcript)
      setCourseLink(youtubeUrl.trim())
      setExtractedTitle(`YouTube: ${data.title || 'Vidéo'}`)
      toast.success(
        `Transcription extraite${data.title ? ` : ${data.title}` : ''} (${data.length} caractères${data.truncated ? ', tronquée à 8000' : ''})`
      )
      setShowYoutube(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setYoutubeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!curriculum) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 mb-4">Cursus introuvable</p>
        <Button onClick={goDashboard} variant="outline">Retour à la carte</Button>
      </div>
    )
  }

  const Icon = iconMap[curriculum.icon] || Code2
  const completedMissions = curriculum.missions.filter((m) => m.status === 'completed').length
  const xpProgress = (curriculum.xp % 500) / 5
  const needsXpForNext = 500 - (curriculum.xp % 500)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={goDashboard}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la carte
      </button>

      {/* Header */}
      <Card className="relative overflow-hidden border-zinc-800/60 bg-zinc-900/40 p-6">
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: curriculum.color }}
        />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: curriculum.color }} />

        <div className="relative flex flex-col md:flex-row md:items-start gap-6">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${curriculum.color}20`,
              border: `1px solid ${curriculum.color}40`,
            }}
          >
            <Icon className="w-8 h-8" style={{ color: curriculum.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{curriculum.name}</h1>
              <Badge
                className="border-zinc-700 bg-zinc-800/50 text-zinc-300"
              >
                Niveau {curriculum.level}
              </Badge>
              {curriculum.agent && (
                <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Agent: {curriculum.agent.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{curriculum.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">{curriculum.xp} XP total</span>
                <span className="text-zinc-500">{needsXpForNext} XP → niveau {curriculum.level + 1}</span>
              </div>
              <Progress value={xpProgress} className="h-2 bg-zinc-800" />
              <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {curriculum.missions.length} missions
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {completedMissions} complétées
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Submit course form */}
      <Card className="border-zinc-800/60 bg-zinc-900/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold">Soumettre un cours</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Trois options : collez une URL DataCamp (ou autre) et cliquez sur Extraire,
          collez vos notes directement, ou combinez les deux. L'IA génère une mission
          style GTA spécifique au chapitre étudié.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="link" className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              Lien du cours (DataCamp, doc, blog...)
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="link"
                value={courseLink}
                onChange={(e) => setCourseLink(e.target.value)}
                placeholder="https://app.datacamp.com/learn/courses/intro-to-python"
                className="flex-1 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs"
              />
              <Button
                onClick={handleExtractUrl}
                disabled={extracting || !courseLink.trim()}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800/50 hover:text-emerald-300"
                type="button"
              >
                {extracting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Extraire
              </Button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">
              L'IA lit la page et remplit le champ contenu automatiquement
            </p>
          </div>

          {/* YouTube import (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowYoutube(!showYoutube)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showYoutube ? 'rotate-180' : ''}`} />
              <Youtube className="w-3.5 h-3.5 text-rose-400" />
              Importer une transcription YouTube
            </button>
            {showYoutube && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs"
                  />
                  <Button
                    onClick={handleYouTube}
                    disabled={youtubeLoading || !youtubeUrl.trim()}
                    variant="outline"
                    className="border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                    type="button"
                  >
                    {youtubeLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Youtube className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Transcrire
                  </Button>
                </div>
                <p className="text-[10px] text-zinc-600">
                  Pour les tutoriels longs (10h+). La transcription est tronquée à 8000 caractères et l'IA génère une mission synthétisant les points clés.
                </p>
              </div>
            )}
          </div>

          {extractedTitle && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-300">
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate">Extrait : {extractedTitle}</span>
            </div>
          )}

          <div>
            <Label htmlFor="content" className="text-xs text-zinc-400">
              Contenu / Notes du cours <span className="text-emerald-400">*</span>
            </Label>
            <Textarea
              id="content"
              value={courseContent}
              onChange={(e) => setCourseContent(e.target.value)}
              placeholder="Ex: Aujourd'hui j'ai appris les variables en Python. Une variable stocke une valeur. On utilise = pour assigner. Les types de base: int, float, str, bool. La fonction type() retourne le type..."
              rows={6}
              className="mt-1 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              {courseContent.length} caractères · minimum 10
            </p>
          </div>

          <Button
            onClick={handleGenerateMission}
            disabled={generating || courseContent.trim().length < 10}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération de la mission...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer une mission
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Missions list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Missions</h2>
          <span className="text-xs text-zinc-500">{curriculum.missions.length} au total</span>
        </div>

        {curriculum.missions.length === 0 ? (
          <Card className="p-8 border-dashed border-zinc-800 bg-zinc-900/20 text-center">
            <Target className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-1">Aucune mission pour l'instant</p>
            <p className="text-xs text-zinc-600">
              Soumettez un cours ci-dessus pour générer votre première mission
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {curriculum.missions.map((m) => (
              <MissionRow
                key={m.id}
                mission={m}
                color={curriculum.color}
                onOpen={() => openMission(m.id, curriculum.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MissionRow({ mission, color, onOpen }: { mission: Mission; color: string; onOpen: () => void }) {
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
    <button onClick={onOpen} className="w-full group text-left">
      <Card className="p-4 border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all hover:border-zinc-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-1 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: mission.status === 'completed' ? '#10B981' : color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{mission.title}</h3>
                {mission.status === 'completed' && (
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[9px]">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Validée
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`${difficultyColor[mission.difficulty]} text-[9px]`}>
                  {difficultyLabel[mission.difficulty]}
                </Badge>
                <span className="text-[10px] text-amber-400">+{mission.xp} XP</span>
              </div>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 rotate-180 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </button>
  )
}
