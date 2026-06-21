'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  User,
  Database,
  Brain,
  Download,
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  Chrome,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BookMarked,
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsView() {
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleReset() {
    if (!confirm('Êtes-vous sûr ? Cette action supprimera TOUS les cursus, missions, agents et conversations. Irréversible.')) {
      return
    }
    setResetting(true)
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Base de données réinitialisée')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setResetting(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const [curriculaRes, agentsRes] = await Promise.all([
        fetch('/api/curricula'),
        fetch('/api/agents'),
      ])
      const curriculaData = await curriculaRes.json()
      const agentsData = await agentsRes.json()
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.4',
        curricula: curriculaData.curricula,
        agents: agentsData.agents,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mnemo-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Données exportées')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => useUI.getState().goDashboard()}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la carte
      </button>

      <div>
        <h1 className="text-2xl font-bold mb-1">Réglages</h1>
        <p className="text-sm text-zinc-400">Configuration et gestion de votre compte Mnemo</p>
      </div>

      {/* Profil */}
      <Card className="p-6 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-bold">Profil</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Nom d'utilisateur</label>
            <div className="mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300">
              Apprenant (mode solo)
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
              Mode solo
            </Badge>
            <span>· Auth multi-utilisateurs à venir (NextAuth.js)</span>
          </div>
        </div>
      </Card>

      {/* Configuration IA */}
      <Card className="p-6 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="font-bold">Intelligence artificielle</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Provider</label>
            <div className="mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300">
              Z.ai (z-ai-web-dev-sdk)
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Fichier de configuration</label>
            <div className="mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 font-mono">
              .z-ai-config
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Créez ce fichier à la racine du projet avec votre clé API Z.ai :
              <code className="block mt-1 px-2 py-1 bg-zinc-950 rounded text-emerald-400">
                {'{ "apiKey": "VOTRE_CLE" }'}
              </code>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>L'IA est utilisée pour : génération de missions, évaluation de code, chat avec agents</span>
          </div>
        </div>
      </Card>

      {/* DataCamp Extension */}
      <Card className="p-6 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Chrome className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="font-bold">Extension DataCamp</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="text-sm font-medium">Mnemo DataCamp Bridge</div>
              <div className="text-[10px] text-zinc-500">Version 1.3.0 · auto-détection des cours</div>
            </div>
            <a
              href="/mnemo-datacamp-extension.zip"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger
            </a>
          </div>
          <a
            href="/mnemo-datacamp-extension/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <FileText className="w-3.5 h-3.5" />
            Voir le guide d'installation
          </a>
        </div>
      </Card>

      {/* Base de données */}
      <Card className="p-6 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-bold">Base de données</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Provider actuel</label>
            <div className="mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300">
              SQLite (file:./db/custom.db)
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Migration vers PostgreSQL recommandée pour le déploiement multi-utilisateurs sur VPS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="border-white/10 hover:bg-white/5"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Exporter les données (JSON)
            </Button>
            <Button
              onClick={handleReset}
              disabled={resetting}
              variant="outline"
              className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
            >
              {resetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Réinitialiser la base
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Obsidian */}
      <Card className="p-6 border-purple-500/30 bg-purple-500/5 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="font-bold">Export Obsidian</h2>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Exportez vos missions complétées en Markdown compatible Obsidian. Chaque mission devient
            un fichier <code className="text-purple-300">.md</code> avec frontmatter YAML, wikilinks
            <code className="text-purple-300">[[...]]</code> entre notions, et métadonnées de révision (FSRS).
          </p>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Compatible Obsidian, Logseq, Foam, et tout lecteur Markdown</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Inclut les dates de prochaine révision (spaced repetition)</span>
          </div>
          <Button
            onClick={async () => {
              try {
                const res = await fetch('/api/export/obsidian')
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                if (data.files.length === 0) {
                  toast.info('Aucune mission complétée à exporter')
                  return
                }
                // Create a downloadable JSON with all files (client-side)
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${data.vaultName}.json`
                a.click()
                URL.revokeObjectURL(url)
                toast.success(`${data.stats.totalMissions} missions exportées (${data.stats.totalCurricula} cursus)`)
              } catch (e: any) {
                toast.error(e.message)
              }
            }}
            className="bg-purple-500 hover:bg-purple-400 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter le vault (JSON)
          </Button>
          <p className="text-[10px] text-zinc-600">
            Le JSON contient tous les fichiers Markdown. Pour un ZIP, utilisez un script Python
            ou convertissez avec <code>jq</code>. Un export ZIP natif est prévu dans une prochaine version.
          </p>
        </div>
      </Card>

      {/* Zone dangereuse */}
      <Card className="p-6 border-rose-500/30 bg-rose-500/5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-rose-300 mb-1">Zone dangereuse</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              La réinitialisation supprime définitivement tous vos cursus, missions, agents et conversations.
              Cette action est irréversible. Pensez à exporter vos données au préalable.
            </p>
            <p className="text-[10px] text-zinc-600">
              Astuce : en mode solo, vos données restent stockées localement dans SQLite.
              Elles ne sont jamais envoyées sur un serveur externe (sauf pour les appels IA).
            </p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 border-white/10 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon className="w-4 h-4 text-zinc-400" />
          <h2 className="font-bold">À propos</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Version</span>
            <span className="font-mono">Mnemo v1.4.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Stack</span>
            <span className="font-mono text-xs">Next.js 16 · Phaser 4 · Prisma 6</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Licence</span>
            <span className="font-mono text-xs">MIT</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
