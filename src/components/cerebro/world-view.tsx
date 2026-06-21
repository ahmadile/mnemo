'use client'

import { useEffect, useState, useMemo } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Network,
  Loader2,
  Users,
  MessageCircle,
  Sparkles,
  Brain,
  Code2,
  Database,
  Cpu,
  ChartLine,
  Zap,
  Radio,
} from 'lucide-react'

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

// Curricula are placed on a circle around the user node
// We'll compute positions for up to 5 curricula
const POSITIONS_5 = [
  { angle: -90, label: 'haut' },     // top
  { angle: -18, label: 'droite-haut' },
  { angle: 54, label: 'droite-bas' },
  { angle: 126, label: 'gauche-bas' },
  { angle: 198, label: 'gauche-haut' },
]

// Pairs of curricula that can communicate (adjacent on the circle)
const COMMUNICATION_PAIRS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
  [0, 2], [1, 3], [2, 4], [3, 0], [4, 1],
]

export function WorldView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const openAgentChat = useUI((s) => s.openAgentChat)
  const openCurriculum = useUI((s) => s.openCurriculum)
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 8000)
    return () => clearInterval(interval)
  }, [])

  // Animate communication pulses
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    try {
      const res = await fetch('/api/curricula')
      const data = await res.json()
      setCurricula(data.curricula || [])
    } finally {
      setLoading(false)
    }
  }

  // Layout constants
  const W = 720
  const H = 600
  const cx = W / 2
  const cy = H / 2
  const radius = 220

  // Compute node positions
  const nodes = useMemo(() => {
    return curricula.slice(0, 5).map((c, i) => {
      const angle = (POSITIONS_5[i].angle * Math.PI) / 180
      return {
        curriculum: c,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        index: i,
      }
    })
  }, [curricula, cx, cy, radius])

  const agentCount = curricula.filter((c) => c.agent).length
  const totalXp = curricula.reduce((sum, c) => sum + c.xp, 0)
  const totalMissions = curricula.reduce((sum, c) => sum + c.missions.length, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        onClick={goDashboard}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour à la carte
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-bold">Le Monde des Agents</h1>
        </div>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Visualisation de votre réseau d'agents-mémoires. Chaque agent est né d'un
          cursus que vous avez poussé jusqu'au niveau 3. Les connexions animées
          représentent les communications possibles entre vos moi virtuels — vous
          pouvez les réveiller pour qu'ils s'évaluent mutuellement, simulent des
          entretiens, ou collaborent sur des problèmes inter-domaines.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={<Users className="w-4 h-4" />} label="Agents actifs" value={agentCount} color="emerald" />
        <StatTile icon={<Brain className="w-4 h-4" />} label="Cursus suivis" value={curricula.length} color="zinc" />
        <StatTile icon={<Zap className="w-4 h-4" />} label="XP cumulée" value={totalXp} color="amber" />
        <StatTile icon={<MessageCircle className="w-4 h-4" />} label="Missions" value={totalMissions} color="zinc" />
      </div>

      {/* Network visualization */}
      <Card className="relative overflow-hidden border-zinc-800/60 bg-zinc-900/40 p-4 md:p-6">
        <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider z-10">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Réseau actif</span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto"
            style={{ minWidth: 480, maxHeight: '70vh' }}
          >
            {/* Background grid */}
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#10B981" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" />
              </pattern>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={W} height={H} fill="url(#grid)" opacity="0.5" />
            <circle cx={cx} cy={cy} r={280} fill="url(#centerGlow)" />

            {/* Communication lines between nodes */}
            {COMMUNICATION_PAIRS.map(([i, j], idx) => {
              const a = nodes[i]
              const b = nodes[j]
              if (!a || !b) return null
              const hasBothAgents = a.curriculum.agent && b.curriculum.agent
              const isActive = (tick + idx) % 5 === 0 && hasBothAgents
              return (
                <g key={`comm-${i}-${j}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={hasBothAgents ? '#10B981' : '#3f3f46'}
                    strokeWidth={hasBothAgents ? 1.2 : 0.6}
                    strokeDasharray={hasBothAgents ? '0' : '4 4'}
                    opacity={hasBothAgents ? 0.5 : 0.4}
                  />
                  {/* Animated pulse along the line when both agents exist */}
                  {hasBothAgents && (
                    <circle r={3} fill="#34d399" opacity={isActive ? 1 : 0}>
                      <animateMotion
                        dur="2s"
                        begin={isActive ? '0s' : 'indefinite'}
                        repeatCount={isActive ? 'indefinite' : '0'}
                        path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                      />
                    </circle>
                  )}
                </g>
              )
            })}

            {/* Lines from center to each node */}
            {nodes.map((n) => (
              <line
                key={`line-${n.curriculum.id}`}
                x1={cx}
                y1={cy}
                x2={n.x}
                y2={n.y}
                stroke={n.curriculum.color}
                strokeWidth={1}
                strokeDasharray="2 4"
                opacity={0.4}
              />
            ))}

            {/* Center node = YOU */}
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={36}
                fill="#0a0a0a"
                stroke="#10B981"
                strokeWidth={2}
                filter="url(#glow)"
              />
              <circle cx={cx} cy={cy} r={48} fill="none" stroke="#10B981" strokeWidth="0.5" opacity={0.3}>
                <animate attributeName="r" from="36" to="60" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <text
                x={cx}
                y={cy - 3}
                textAnchor="middle"
                fill="#10B981"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                VOUS
              </text>
              <text
                x={cx}
                y={cy + 11}
                textAnchor="middle"
                fill="#71717a"
                fontSize="8"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                {totalXp} XP
              </text>
            </g>

            {/* Curriculum nodes */}
            {nodes.map((n) => {
              const c = n.curriculum
              const Icon = iconMap[c.icon] || Code2
              const hasAgent = !!c.agent
              const r = hasAgent ? 32 : 26

              return (
                <g
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => hasAgent ? openAgentChat(c.agent!.id) : openCurriculum(c.id)}
                >
                  {/* Outer ring for agents */}
                  {hasAgent && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={r + 6}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity={0.5}
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${n.x} ${n.y}`}
                        to={`360 ${n.x} ${n.y}`}
                        dur="20s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Node circle */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill="#0a0a0a"
                    stroke={c.color}
                    strokeWidth={hasAgent ? 2 : 1}
                    opacity={hasAgent ? 1 : 0.6}
                  />

                  {/* Node icon (we'll use text since SVG can't easily render lucide) */}
                  <text
                    x={n.x}
                    y={n.y - 2}
                    textAnchor="middle"
                    fill={c.color}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-geist-sans), sans-serif"
                  >
                    {c.name.slice(0, 8).toUpperCase()}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 11}
                    textAnchor="middle"
                    fill={hasAgent ? '#a1a1aa' : '#52525b'}
                    fontSize="8"
                    fontFamily="var(--font-geist-sans), sans-serif"
                  >
                    {hasAgent ? `${c.agent!.name} · Lv${c.agent!.level}` : `Lv ${c.level}`}
                  </text>

                  {/* Agent status indicator */}
                  {hasAgent && (
                    <circle
                      cx={n.x + r - 4}
                      cy={n.y - r + 4}
                      r={3}
                      fill="#10B981"
                    >
                      <animate
                        attributeName="opacity"
                        from="1"
                        to="0.3"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Label below */}
                  <text
                    x={n.x}
                    y={n.y + r + 14}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="9"
                    fontFamily="var(--font-geist-sans), sans-serif"
                  >
                    {c.missions.length} missions
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-950 border-2 border-emerald-400" />
            <span>Vous (centre du réseau)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-600 opacity-60" />
            <span>Cursus en cours (pas encore d'agent)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-950 border-2 border-emerald-400" />
            <span>Agent-mémoire né</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px bg-emerald-400" />
            <span>Communication active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px border-t border-dashed border-zinc-600" />
            <span>Communication potentielle</span>
          </div>
        </div>
      </Card>

      {/* Empty state explainer when no agents */}
      {agentCount === 0 && (
        <Card className="p-6 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-300 mb-1">
                Aucun agent-mémoire né pour l'instant
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                Le réseau est en attente. Les agents apparaissent automatiquement
                quand vous atteignez le niveau 3 dans un cursus (1500 XP). Chaque
                mission complétée rapporte 100 à 300 XP selon la difficulté.
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Une fois vos agents nés, les connexions vertes animées apparaîtront
                entre eux sur le graphique ci-dessus, montrant les communications
                possibles. Vous pourrez alors lancer des scénarios d'interaction
                (entretien simulé, collaboration inter-domaines, etc.).
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Curriculum detail list */}
      <div>
        <h2 className="text-lg font-bold mb-3">Cursus du réseau</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {curricula.map((c) => {
            const Icon = iconMap[c.icon] || Code2
            const hasAgent = !!c.agent
            return (
              <button
                key={c.id}
                onClick={() => hasAgent ? openAgentChat(c.agent!.id) : openCurriculum(c.id)}
                className="group text-left"
              >
                <Card className="p-4 border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all hover:border-zinc-700 relative overflow-hidden h-full">
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: c.color }}
                  />
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${c.color}20`,
                        border: `1px solid ${c.color}40`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{c.name}</div>
                      <div className="text-[10px] text-zinc-500">Niveau {c.level} · {c.xp} XP</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">{c.missions.length} missions</span>
                    {hasAgent ? (
                      <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[9px]">
                        <Users className="w-2.5 h-2.5 mr-1" /> {c.agent!.name}
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800/50 text-zinc-500 border-zinc-700/50 text-[9px]">
                        En attente
                      </Badge>
                    )}
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      </div>

      {/* Concept section */}
      <Card className="p-6 border-zinc-800/60 bg-zinc-900/40">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold">Le concept</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          Mnemo transforme chaque cours que vous apprenez en une mission interactive,
          puis capture votre compétence dans un agent-mémoire interrogeable. Votre
          réseau grandit au fur et à mesure — chaque agent est un snapshot de votre
          savoir à un moment précis, dans un domaine précis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ConceptBox
            icon={<Code2 className="w-4 h-4" />}
            title="1. Mission"
            text="Soumettez un cours. L'IA génère un défi de code scénarisé borné au chapitre étudié."
            color="#3B82F6"
          />
          <ConceptBox
            icon={<Sparkles className="w-4 h-4" />}
            title="2. Progression"
            text="Complétez des missions. Gagnez de l'XP. Atteignez le niveau 3 pour débloquer un agent."
            color="#F59E0B"
          />
          <ConceptBox
            icon={<Users className="w-4 h-4" />}
            title="3. Mémoire"
            text="L'agent naît avec votre style et vos acquis. Discutez avec lui comme avec votre futur vous."
            color="#10B981"
          />
        </div>
      </Card>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'emerald' | 'amber' | 'zinc'
}) {
  const colorMap = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
    zinc: 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300',
  }
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 opacity-70 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}

function ConceptBox({
  icon,
  title,
  text,
  color,
}: {
  icon: React.ReactNode
  title: string
  text: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-4">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40`, color }}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-sm mb-1" style={{ color }}>
        {title}
      </h4>
      <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
    </div>
  )
}
