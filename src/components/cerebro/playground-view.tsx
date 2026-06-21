'use client'

import { useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  FlaskConical,
  Brain,
  Code2,
  Network,
  ExternalLink,
  Play,
  BookOpen,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string
  icon: any
  url: string
  category: 'python' | 'ai' | 'algorithms' | 'data'
  categoryLabel: string
  color: string
  embeddable: boolean
  whatItTeaches: string
}

const TOOLS: Tool[] = [
  {
    id: 'tf-playground',
    name: 'TensorFlow Playground',
    description: 'Visualisez un réseau de neurones qui apprend en temps réel. Aucun code, aucune math — cliquez et regardez.',
    icon: Brain,
    url: 'https://playground.tensorflow.org',
    category: 'ai',
    categoryLabel: 'IA / Machine Learning',
    color: '#f59e0b',
    embeddable: true,
    whatItTeaches: 'Réseaux de neurones, couches, taux d\'apprentissage, régularisation, fonctions d\'activation',
  },
  {
    id: 'python-tutor',
    name: 'Python Tutor',
    description: 'Collez du code Python et visualisez son exécution ligne par ligne avec diagrammes de mémoire.',
    icon: Code2,
    url: 'https://pythontutor.com/render.html#mode=edit',
    category: 'python',
    categoryLabel: 'Python',
    color: '#3b82f6',
    embeddable: true,
    whatItTeaches: 'Exécution pas à pas, piles d\'appels, objets en mémoire, portée des variables',
  },
  {
    id: 'mlu-explain',
    name: 'MLU Explain',
    description: 'Essais visuels interactifs sur le gradient descent, arbres de décision, ROC curves, k-means...',
    icon: Sparkles,
    url: 'https://mlu-explain.github.io/',
    category: 'ai',
    categoryLabel: 'IA / Machine Learning',
    color: '#a855f7',
    embeddable: true,
    whatItTeaches: 'Gradient descent, bias/variance, arbres de décision, forêts aléatoires, clustering',
  },
  {
    id: 'algo-visualizer',
    name: 'Algorithm Visualizer',
    description: 'Animations d\'algorithmes de tri, parcours de graphes (BFS/DFS/Dijkstra), structures de données.',
    icon: Network,
    url: 'https://algorithm-visualizer.org/',
    category: 'algorithms',
    categoryLabel: 'Algorithmes',
    color: '#10b981',
    embeddable: true,
    whatItTeaches: 'Tri (bubble, quick, merge), graphes (BFS, DFS, Dijkstra, A*), structures de données',
  },
  {
    id: 'visualgo',
    name: 'VisuAlgo',
    description: 'Visualisations d\'algorithmes et structures de données avec explications en français.',
    icon: Network,
    url: 'https://visualgo.net/fr',
    category: 'algorithms',
    categoryLabel: 'Algorithmes',
    color: '#06b6d4',
    embeddable: true,
    whatItTeaches: 'Structures de données (listes, arbres, tas), algorithmes de tri, de recherche, de graphe',
  },
  {
    id: 'neural-network-svg',
    name: 'NN SVG',
    description: 'Générez des visualisations de réseaux de neurones personnalisables. Idéal pour comprendre l\'architecture.',
    icon: Brain,
    url: 'https://alexlenail.me/NN-SVG/',
    category: 'ai',
    categoryLabel: 'IA / Machine Learning',
    color: '#ef4444',
    embeddable: true,
    whatItTeaches: 'Architecture de réseaux de neurones, couches fully-connected, convolution, AlexNet',
  },
]

export function PlaygroundView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const [activeTool, setActiveTool] = useState<Tool | null>(null)

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
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-emerald-400" />
          Playground
        </h1>
        <p className="text-sm text-zinc-400">
          Apprenez en vous amusant — outils interactifs open source pour visualiser les concepts sans complexité
        </p>
      </div>

      {/* Intro card */}
      <Card className="p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">Le concept du Playground</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pas de code à écrire, pas de complexité. Cliquez sur un outil, explorez librement,
              et les concepts deviennent évidents. Ces outils sont 100% open source et gratuits.
              Idéal avant ou après une mission Mnemo pour ancrer la compréhension.
            </p>
          </div>
        </div>
      </Card>

      {activeTool ? (
        /* Active tool view — embedded iframe */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTool(null)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour aux outils
              </button>
              <span className="text-zinc-600">/</span>
              <span className="text-sm font-medium">{activeTool.name}</span>
            </div>
            <a
              href={activeTool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <ExternalLink className="w-3 h-3" />
              Ouvrir dans un nouvel onglet
            </a>
          </div>

          <Card className="overflow-hidden border-white/10 bg-zinc-950 p-0">
            <iframe
              src={activeTool.url}
              className="w-full"
              style={{ height: '70vh', minHeight: 500 }}
              title={activeTool.name}
              allow="clipboard-read; clipboard-write; fullscreen"
            />
          </Card>
        </div>
      ) : (
        /* Tool grid */
        <>
          {/* Category: AI/ML */}
          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              IA & Machine Learning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.filter((t) => t.category === 'ai').map((tool) => (
                <ToolCard key={tool.id} tool={tool} onOpen={() => setActiveTool(tool)} />
              ))}
            </div>
          </div>

          {/* Category: Python */}
          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              Python
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.filter((t) => t.category === 'python').map((tool) => (
                <ToolCard key={tool.id} tool={tool} onOpen={() => setActiveTool(tool)} />
              ))}
            </div>
          </div>

          {/* Category: Algorithms */}
          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              Algorithmes & Structures de données
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.filter((t) => t.category === 'algorithms').map((tool) => (
                <ToolCard key={tool.id} tool={tool} onOpen={() => setActiveTool(tool)} />
              ))}
            </div>
          </div>

          {/* Coming soon */}
          <Card className="p-5 border-dashed border-zinc-700 bg-zinc-900/20 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-zinc-500" />
              <h3 className="font-bold text-sm text-zinc-400">Bientôt disponible</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <strong className="text-zinc-400">JupyterLite</strong> — Notebook Python complet (pandas, numpy, matplotlib) dans le navigateur
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <strong className="text-zinc-400">Sandpack</strong> — Éditeur de code live pour les missions JavaScript/React
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <strong className="text-zinc-400">Datasets interactifs</strong> — Explorez des datasets réels sans écrire de code
              </li>
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}

function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: () => void }) {
  const Icon = tool.icon
  return (
    <button onClick={onOpen} className="group text-left w-full">
      <Card className="relative overflow-hidden p-4 border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all hover:border-white/20 backdrop-blur-xl h-full">
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: tool.color }}
        />
        <div className="relative flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${tool.color}20`,
              border: `1px solid ${tool.color}40`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: tool.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sm">{tool.name}</h3>
              <Badge className="bg-white/5 text-zinc-400 border-white/10 text-[9px]">
                {tool.categoryLabel}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-2">{tool.description}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Play className="w-2.5 h-2.5" style={{ color: tool.color }} />
              <span>Ce que vous allez comprendre : {tool.whatItTeaches}</span>
            </div>
          </div>
        </div>
      </Card>
    </button>
  )
}
