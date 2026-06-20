'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Chrome,
  FileText,
  X,
} from 'lucide-react'

interface DataCampStatus {
  connected: boolean
  extensionAvailable: boolean
  extensionUrl: string
  instructions: string[]
}

export function DatacampStatus() {
  const [status, setStatus] = useState<DataCampStatus | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/integrations/datacamp')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status) return null

  return (
    <>
      <Card className="relative overflow-hidden border-zinc-800/60 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 p-4">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400" />
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <Chrome className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-sm">Intégration DataCamp</h3>
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[9px]">
                <AlertCircle className="w-2.5 h-2.5 mr-1" />
                Extension requise
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              DataCamp n'a pas d'API publique. Pour capturer vos cours automatiquement,
              installez l'extension Chrome "Mnemo Bridge". Une fois installée, naviguez sur
              DataCamp et cliquez sur l'icône Mnemo dans votre barre d'extensions.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger l'extension
              </button>
              <a
                href="https://app.datacamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Aller sur DataCamp
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal with install instructions */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <Card
            className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-700 p-6"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Chrome className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Extension Mnemo · DataCamp Bridge</h2>
                <p className="text-xs text-zinc-500">Capturez vos cours DataCamp en 1 clic</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-2">1. Télécharger</h3>
                <a
                  href="/download/mnemo-datacamp-extension/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le dossier extension
                </a>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Le dossier contient manifest.json, popup, content script et icônes.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-2">2. Installer dans Chrome</h3>
                <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside">
                  <li>Ouvrez <code className="text-emerald-400 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">chrome://extensions/</code></li>
                  <li>Activez le <strong className="text-zinc-200">Mode développeur</strong> (en haut à droite)</li>
                  <li>Cliquez sur <strong className="text-zinc-200">Charger l'extension non empaquetée</strong></li>
                  <li>Sélectionnez le dossier <code className="text-emerald-400 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">mnemo-datacamp-extension/</code> téléchargé</li>
                  <li>L'icône Mnemo apparaît dans votre barre d'extensions</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-2">3. Configurer</h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Cliquez sur l'icône Mnemo dans Chrome. Vérifiez que l'URL du serveur Mnemo
                  est correcte (par défaut <code className="text-emerald-400 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">http://localhost:3000</code>).
                  Le statut doit afficher <span className="text-emerald-400">"Connecté à Mnemo"</span>.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-2">4. Capturer un cours</h3>
                <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside">
                  <li>Naviguez vers un cours sur <code className="text-emerald-400 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">app.datacamp.com</code></li>
                  <li>Un badge "Mnemo prêt à capturer" apparaît en bas à droite</li>
                  <li>Cliquez sur l'icône Mnemo dans la barre d'extensions</li>
                  <li>Sélectionnez le cursus cible (Python, SQL, etc.)</li>
                  <li>Cliquez sur <strong className="text-zinc-200">Capturer & Envoyer</strong></li>
                  <li>Mnemo s'ouvre automatiquement sur la mission générée</li>
                </ol>
              </div>

              <div className="p-3 rounded-md border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                    Alternative sans extension
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Si vous ne voulez pas installer l'extension, vous pouvez aussi copier-coller
                  manuellement le contenu de vos cours DataCamp dans le formulaire de soumission
                  de chaque cursus. L'IA générera la mission de la même façon.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
