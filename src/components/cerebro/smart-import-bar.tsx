'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Link2,
  Loader2,
  Sparkles,
  FileText,
  Youtube,
  Github,
  Database,
  Globe,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface SmartImportBarProps {
  onContentExtracted: (content: string, title: string, url: string) => void
  curriculumName?: string
}

type DetectedType = 'datacamp' | 'youtube' | 'github' | 'article' | 'unknown'

const TYPE_CONFIG: Record<DetectedType, { label: string; icon: any; color: string }> = {
  datacamp: { label: 'DataCamp', icon: Database, color: '#3b82f6' },
  youtube: { label: 'YouTube', icon: Youtube, color: '#ef4444' },
  github: { label: 'GitHub', icon: Github, color: '#6b7280' },
  article: { label: 'Article/Doc', icon: FileText, color: '#10b981' },
  unknown: { label: 'Lien', icon: Globe, color: '#a855f7' },
}

function detectType(url: string): DetectedType {
  const lower = url.toLowerCase()
  if (lower.includes('datacamp.com')) return 'datacamp'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('github.com')) return 'github'
  if (lower.includes('medium.com') || lower.includes('dev.to') || lower.includes('docs.') ||
      lower.includes('wikipedia.org') || lower.includes('mdn') || lower.includes('w3schools') ||
      lower.includes('tutorial') || lower.includes('blog')) return 'article'
  return 'unknown'
}

export function SmartImportBar({ onContentExtracted, curriculumName }: SmartImportBarProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualContent, setManualContent] = useState('')
  const [detectedType, setDetectedType] = useState<DetectedType | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleUrlChange(value: string) {
    setUrl(value)
    if (value.startsWith('http')) {
      setDetectedType(detectType(value))
    } else {
      setDetectedType(null)
    }
  }

  async function handleImport() {
    if (!url.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/smart-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.warning && !data.content) {
        toast.error(data.warning)
        // Switch to manual mode
        setShowManual(true)
        setManualContent('')
        return
      }

      if (data.warning) {
        toast.info(data.warning)
      }

      if (data.content && data.content.length > 50) {
        onContentExtracted(data.content, data.title, url.trim())
        toast.success(
          `Contenu importé (${data.length} caractères) — ${TYPE_CONFIG[data.type as DetectedType].label}`,
        )
        setUrl('')
        setDetectedType(null)
      } else {
        toast.error('Contenu trop court. Collez le contenu manuellement.')
        setShowManual(true)
      }
    } catch (e: any) {
      toast.error(e.message)
      setShowManual(true)
    } finally {
      setLoading(false)
    }
  }

  function handleManualSubmit() {
    if (manualContent.trim().length < 10) {
      toast.error('Le contenu doit faire au moins 10 caractères')
      return
    }
    onContentExtracted(manualContent.trim(), url.trim() || 'Contenu manuel', url.trim())
    toast.success(`Contenu ajouté (${manualContent.length} caractères)`)
    setManualContent('')
    setShowManual(false)
  }

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Smart Import</h3>
          <p className="text-[10px] text-zinc-500">
            Collez un lien (DataCamp, YouTube, GitHub, blog, doc) — l'IA détecte et extrait automatiquement
          </p>
        </div>
      </div>

      {/* URL input with auto-detection */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleImport()
              }
            }}
            placeholder="https://app.datacamp.com/... ou https://youtube.com/... ou n'importe quel lien"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-sm font-mono focus:border-emerald-500/50 focus:outline-none transition-colors"
            disabled={loading}
          />
          {detectedType && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge
                className="text-[9px]"
                style={{
                  backgroundColor: `${TYPE_CONFIG[detectedType].color}20`,
                  color: TYPE_CONFIG[detectedType].color,
                  border: `1px solid ${TYPE_CONFIG[detectedType].color}40`,
                }}
              >
                {TYPE_CONFIG[detectedType].label}
              </Badge>
            </div>
          )}
        </div>
        <Button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Importer'
          )}
        </Button>
      </div>

      {/* Quick type indicators */}
      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          return (
            <div
              key={key}
              className="flex items-center gap-1 text-[9px] text-zinc-600"
            >
              <Icon className="w-2.5 h-2.5" style={{ color: config.color }} />
              <span>{config.label}</span>
            </div>
          )
        })}
      </div>

      {/* Manual paste toggle */}
      <button
        onClick={() => setShowManual(!showManual)}
        className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
      >
        {showManual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Coller le contenu manuellement
      </button>

      {showManual && (
        <div className="mt-2 space-y-2">
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder="Collez ici vos notes de cours, le contenu d'un exercice, une transcription..."
            rows={5}
            className="w-full p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs focus:border-emerald-500/50 focus:outline-none"
          />
          <Button
            onClick={handleManualSubmit}
            disabled={manualContent.trim().length < 10}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Utiliser ce contenu ({manualContent.length} caractères)
          </Button>
        </div>
      )}
    </Card>
  )
}
