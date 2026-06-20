'use client'

import { useEffect, useState } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Loader2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  persona: string
  skills: string
  totalXp: number
  level: number
  status: string
  activity: string
  createdAt: string
  curriculum: {
    name: string
    domain: string
    color: string
    icon: string
  }
}

const domainInitials: Record<string, string> = {
  python: 'PY',
  sql: 'SQ',
  'ai-engineering': 'AI',
  'data-science': 'DS',
  'web-dev': 'WB',
}

export function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const goDashboard = useUI((s) => s.goDashboard)
  const openAgentChat = useUI((s) => s.openAgentChat)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data.agents || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button
        onClick={goDashboard}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la carte
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-bold">Vos agents virtuels</h1>
        </div>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Chaque agent est né d'un cursus que vous avez poussé jusqu'au niveau 3.
          C'est votre mémoire virtuelle dans ce domaine - votre &ldquo;vous&rdquo; du futur
          qui se souvient de tout ce que vous avez appris. Discutez avec eux pour
          réviser, demander un rappel, ou obtenir un conseil.
        </p>
      </div>

      {agents.length === 0 ? (
        <Card className="p-12 border-dashed border-zinc-800 bg-zinc-900/20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="font-semibold text-zinc-300 mb-2">Aucun agent né pour l'instant</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6 leading-relaxed">
            Les agents apparaissent automatiquement quand vous atteignez le niveau 3
            dans un cursus. Complétez des missions pour gagner de l'XP et faire naître
            votre premier agent.
          </p>
          <Button onClick={goDashboard} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950">
            <Sparkles className="w-4 h-4 mr-2" />
            Retour aux cursus
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onOpen={() => openAgentChat(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent, onOpen }: { agent: Agent; onOpen: () => void }) {
  const skills: string[] = JSON.parse(agent.skills)
  const initials =
    domainInitials[agent.curriculum.domain] || agent.name.slice(0, 2).toUpperCase()

  return (
    <button onClick={onOpen} className="group text-left w-full">
      <Card className="relative overflow-hidden p-5 border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all hover:border-zinc-700 h-full">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: agent.curriculum.color }}
        />
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: agent.curriculum.color }}
        />

        <div className="relative">
          {/* Avatar + name */}
          <div className="flex items-start gap-3 mb-4">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${agent.curriculum.color}, ${agent.curriculum.color}80)`,
                  color: '#0a0a0a',
                }}
              >
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-zinc-100 truncate">{agent.name}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {agent.curriculum.name} · Niv {agent.level}
              </p>
              <Badge className="mt-1 bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[9px]">
                {agent.totalXp} XP
              </Badge>
            </div>
          </div>

          {/* Persona */}
          <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-3 italic">
            &ldquo;{agent.persona}&rdquo;
          </p>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {skills.slice(0, 3).map((s, i) => (
                <Badge
                  key={i}
                  className="bg-zinc-800/50 text-zinc-300 border-zinc-700/50 text-[9px]"
                >
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate">{agent.activity}</span>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Discuter
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Card>
    </button>
  )
}
