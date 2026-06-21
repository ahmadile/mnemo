'use client'

import { useEffect, useState, useMemo } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/cerebro/avatar'
import { ActivityHeatmap } from '@/components/cerebro/activity-heatmap'
import { DatacampStatus } from '@/components/cerebro/datacamp-status'
import { CreateCurriculumDialog } from '@/components/cerebro/create-curriculum-dialog'
import {
  Brain,
  ChevronRight,
  Sparkles,
  Target,
  Users,
  Plus,
  MapPin,
  Compass,
  Crown,
  Zap,
  CheckCircle2,
  Flame,
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
  isCustom?: boolean
  language?: string
  datacampUrl?: string | null
  datacampProgress?: number
  completedCourses?: string
  missions: Mission[]
  agent: Agent | null
}

interface DailyQuest {
  id: string
  title: string
  description: string
  xpReward: number
  status: 'pending' | 'completed'
  type: string
}

// Calculate node positions dynamically based on count
// Uses a golden spiral (phyllotaxis) that scales beautifully from 1 to 100+ cursus
function calculatePositions(count: number): { x: number; y: number; size: number }[] {
  const cx = 500 // center X
  const cy = 325 // center Y
  const positions: { x: number; y: number; size: number }[] = []

  if (count <= 1) {
    return [{ x: cx, y: cy - 100, size: 1.2 }]
  }

  // Scale node size inversely with count
  const nodeSize = Math.max(0.45, Math.min(1.2, 1.2 - (count - 5) * 0.02))

  if (count <= 6) {
    // Small count: circle layout (aesthetically pleasing)
    const radius = 200
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      positions.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius * 0.7, // ellipse for wider map
        size: nodeSize,
      })
    }
    return positions
  }

  // Large count: golden spiral (phyllotaxis like sunflower seeds)
  // Scales gracefully to 50+ cursus
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~2.39996 rad
  // Scale spacing inversely with count so nodes don't overlap
  const spacing = Math.max(18, Math.min(60, 60 - (count - 6) * 0.5))
  const maxRadius = 420 // stay within viewBox

  for (let i = 0; i < count; i++) {
    const angle = i * goldenAngle
    const radius = Math.sqrt(spacing * i / Math.PI) * 14
    // Clamp to maxRadius
    const r = Math.min(radius, maxRadius)
    positions.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.75, // ellipse
      size: nodeSize,
    })
  }

  return positions
}

export function DashboardView() {
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const openCurriculum = useUI((s) => s.openCurriculum)
  const openAgents = useUI((s) => s.openAgents)

  useEffect(() => {
    refresh()
    loadDailyQuests()
    loadActivity()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/curricula')
      const data = await res.json()
      setCurricula(data.curricula || [])
    } finally {
      setLoading(false)
    }
  }

  async function loadActivity() {
    try {
      const res = await fetch('/api/activity')
      const data = await res.json()
      setActivityData(data.data || [])
      setStreak(data.streak || 0)
    } catch {
      // silent
    }
  }

  async function loadDailyQuests() {
    try {
      const res = await fetch('/api/daily-quests')
      const data = await res.json()
      setDailyQuests(data.quests || [])
    } catch {
      // silent
    }
  }

  const totalAgents = curricula.filter((c) => c.agent).length
  const totalMissions = curricula.reduce((sum, c) => sum + c.missions.length, 0)
  const completedMissions = curricula.reduce(
    (sum, c) => sum + c.missions.filter((m) => m.status === 'completed').length,
    0
  )
  const totalXp = curricula.reduce((sum, c) => sum + c.xp, 0)

  // Compute positions for all curricula dynamically
  const positionedCurricula = useMemo(() => {
    const positions = calculatePositions(curricula.length)
    return curricula.map((c, i) => ({
      ...c,
      position: positions[i] || { x: 500, y: 325, size: 1 },
    }))
  }, [curricula])

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* DataCamp status banner */}
      <DatacampStatus />

      {/* Daily quests */}
      {dailyQuests.length > 0 && (
        <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Quêtes quotidiennes</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Révisez chaque jour pour ancrer vos acquis
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                {dailyQuests.filter((q) => q.status === 'completed').length}/{dailyQuests.length} terminées
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                    quest.status === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {quest.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500/40 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${quest.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {quest.title}
                    </div>
                    <div className="text-[10px] text-amber-400">+{quest.xpReward} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Fantasy Map */}
      <Card className="relative overflow-hidden border-white/10 bg-zinc-950/60 backdrop-blur-xl p-0">
        {/* Map header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-zinc-100">Carte du Monde Mnemo</h2>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {curricula.length} territoire{curricula.length > 1 ? 's' : ''} · {totalAgents} agent{totalAgents > 1 ? 's' : ''} né{totalAgents > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors backdrop-blur-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau cursus
          </button>
        </div>

        {/* SVG map */}
        <div className="relative w-full" style={{ aspectRatio: '1000/650' }}>
          <svg
            viewBox="0 0 1000 650"
            className="w-full h-full mnemo-map-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Gradients per region color */}
              <radialGradient id="grad-center" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              {/* Grid pattern */}
              <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#27272a" strokeWidth="0.5" />
              </pattern>
              {/* Glow filter */}
              <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width="1000" height="650" fill="#0a0a0a" />
            <rect width="1000" height="650" fill="url(#map-grid)" opacity="0.5" />

            {/* Central plaza glow */}
            <circle cx="500" cy="325" r="250" fill="url(#grad-center)" />

            {/* Decorative paths between nodes (roads) */}
            {positionedCurricula.length > 1 && positionedCurricula.map((c, i) => {
              if (i === positionedCurricula.length - 1) return null
              const next = positionedCurricula[(i + 1) % positionedCurricula.length]
              return (
                <line
                  key={`path-${c.id}`}
                  x1={c.position.x}
                  y1={c.position.y}
                  x2={next.position.x}
                  y2={next.position.y}
                  stroke="#27272a"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />
              )
            })}

            {/* Path from center to each node */}
            {positionedCurricula.map((c) => (
              <line
                key={`center-path-${c.id}`}
                x1="500"
                y1="325"
                x2={c.position.x}
                y2={c.position.y}
                stroke={c.color}
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity="0.3"
              />
            ))}

            {/* Center: YOU */}
            <g>
              <circle cx="500" cy="325" r="45" fill="#0a0a0a" stroke="#10b981" strokeWidth="2" filter="url(#node-glow)" />
              <circle cx="500" cy="325" r="60" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.4">
                <animate attributeName="r" from="45" to="80" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="500" cy="325" r="60" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.3">
                <animate attributeName="r" from="45" to="80" dur="3s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="3s" begin="1.5s" repeatCount="indefinite" />
              </circle>
              <text x="500" y="322" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="700" fontFamily="sans-serif">
                VOUS
              </text>
              <text x="500" y="338" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="sans-serif">
                {totalXp} XP · Niv {Math.floor(totalXp / 500) + 1}
              </text>
            </g>

            {/* Curriculum nodes */}
            {positionedCurricula.map((c) => {
              const r = (c.agent ? 36 : 28) * c.position.size
              const isHovered = hoveredId === c.id
              const isSelected = selectedId === c.id
              const completed = c.missions.filter((m) => m.status === 'completed').length
              const total = c.missions.length
              const dcProgress = c.datacampProgress || 0
              return (
                <g
                  key={c.id}
                  className="cursor-pointer transition-all"
                  onClick={() => {
                    setSelectedId(c.id)
                    openCurriculum(c.id)
                  }}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ transformOrigin: `${c.position.x}px ${c.position.y}px` }}
                >
                  {/* Hover glow */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx={c.position.x}
                      cy={c.position.y}
                      r={r + 15}
                      fill={c.color}
                      opacity="0.15"
                    />
                  )}

                  {/* Agent ring (rotating) */}
                  {c.agent && (
                    <circle
                      cx={c.position.x}
                      cy={c.position.y}
                      r={r + 8}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.6"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${c.position.x} ${c.position.y}`}
                        to={`360 ${c.position.x} ${c.position.y}`}
                        dur="25s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Main node */}
                  <circle
                    cx={c.position.x}
                    cy={c.position.y}
                    r={r}
                    fill="#0a0a0a"
                    stroke={c.color}
                    strokeWidth={c.agent ? 2.5 : 1.5}
                    style={{
                      transition: 'all 0.3s',
                      filter: isHovered ? `drop-shadow(0 0 12px ${c.color}80)` : 'none',
                    }}
                  />

                  {/* Inner gradient */}
                  <circle
                    cx={c.position.x}
                    cy={c.position.y}
                    r={r - 4}
                    fill={c.color}
                    opacity="0.1"
                  />

                  {/* Curriculum icon (initials) */}
                  <text
                    x={c.position.x}
                    y={c.position.y - 2}
                    textAnchor="middle"
                    fill={c.color}
                    fontSize={r > 30 ? "14" : "11"}
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {c.name.slice(0, 8).toUpperCase()}
                  </text>

                  {/* Level/agent info */}
                  <text
                    x={c.position.x}
                    y={c.position.y + 14}
                    textAnchor="middle"
                    fill={c.agent ? "#a1a1aa" : "#52525b"}
                    fontSize="9"
                    fontFamily="sans-serif"
                  >
                    {c.agent ? `${c.agent.name}` : `Niv ${c.level}`}
                  </text>

                  {/* Status dot (top-right of node) */}
                  {c.agent && (
                    <circle
                      cx={c.position.x + r - 4}
                      cy={c.position.y - r + 4}
                      r="4"
                      fill="#10b981"
                    >
                      <animate attributeName="opacity" from="1" to="0.3" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* DataCamp progress ring (if has datacamp progress) */}
                  {dcProgress > 0 && (
                    <circle
                      cx={c.position.x}
                      cy={c.position.y}
                      r={r + 4}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="2"
                      strokeDasharray={`${(dcProgress / 100) * 2 * Math.PI * (r + 4)} ${2 * Math.PI * (r + 4)}`}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${c.position.x} ${c.position.y})`}
                      opacity="0.7"
                    />
                  )}

                  {/* Label below node */}
                  <text
                    x={c.position.x}
                    y={c.position.y + r + 16}
                    textAnchor="middle"
                    fill={isHovered ? c.color : "#71717a"}
                    fontSize="10"
                    fontFamily="sans-serif"
                    fontWeight={isHovered ? "600" : "400"}
                  >
                    {c.name}
                  </text>
                  <text
                    x={c.position.x}
                    y={c.position.y + r + 28}
                    textAnchor="middle"
                    fill="#52525b"
                    fontSize="9"
                    fontFamily="sans-serif"
                  >
                    {completed}/{total} missions{dcProgress > 0 ? ` · ${dcProgress}% DC` : ''}
                  </text>
                </g>
              )
            })}

            {/* Add new cursus node (+) */}
            {curricula.length < 8 && (
              <g
                className="cursor-pointer"
                onClick={() => setCreateOpen(true)}
                onMouseEnter={() => setHoveredId('new')}
                onMouseLeave={() => setHoveredId(null)}
              >
                <circle
                  cx={curricula.length === 0 ? 500 : 500}
                  cy={curricula.length === 0 ? 200 : 200}
                  r="22"
                  fill="#0a0a0a"
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity={hoveredId === 'new' ? 1 : 0.6}
                />
                <text
                  x={curricula.length === 0 ? 500 : 500}
                  y={curricula.length === 0 ? 207 : 207}
                  textAnchor="middle"
                  fill={hoveredId === 'new' ? '#10b981' : '#52525b'}
                  fontSize="22"
                  fontFamily="sans-serif"
                >
                  +
                </text>
                <text
                  x={curricula.length === 0 ? 500 : 500}
                  y={curricula.length === 0 ? 245 : 245}
                  textAnchor="middle"
                  fill="#52525b"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  Nouveau cursus
                </text>
              </g>
            )}

            {/* Compass rose (decorative, bottom-right) */}
            <g transform="translate(920, 570)" opacity="0.4">
              <circle cx="0" cy="0" r="30" fill="none" stroke="#3f3f46" strokeWidth="0.5" />
              <path d="M 0 -25 L 5 0 L 0 25 L -5 0 Z" fill="#10b981" opacity="0.6" />
              <text x="0" y="-30" textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="sans-serif">N</text>
              <text x="0" y="38" textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="sans-serif">S</text>
              <text x="35" y="3" textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="sans-serif">E</text>
              <text x="-35" y="3" textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="sans-serif">O</text>
            </g>
          </svg>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Chargement du monde...</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="Cursus suivis"
          value={curricula.length}
          color="emerald"
          onClick={() => {}}
        />
        <StatCard
          icon={<Sparkles className="w-4 h-4" />}
          label="Missions générées"
          value={totalMissions}
          color="amber"
          onClick={() => useUI.getState().openMissions()}
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Missions complétées"
          value={completedMissions}
          color="emerald"
          onClick={() => useUI.getState().openMissions()}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Agents nés"
          value={totalAgents}
          color="purple"
          onClick={openAgents}
        />
      </div>

      {/* Activity heatmap */}
      {activityData.length > 0 && (
        <ActivityHeatmap data={activityData} streak={streak} />
      )}

      {/* Empty state hint */}
      {curricula.length === 0 && !loading && (
        <Card className="p-6 border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-amber-300 mb-1">Bienvenue dans votre monde vierge</h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-2">
                Pour commencer : installez l'extension Chrome (en haut de la page) pour capturer
                vos cours DataCamp, ou créez manuellement un cursus personnalisé. Chaque mission
                complétée rapporte de l'XP et fait naître des agents-mémoire.
              </p>
              <p className="text-xs text-zinc-500">
                Objectif : atteindre le niveau 3 (1500 XP) sur un cursus pour faire naître votre premier agent.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Active agents preview */}
      {totalAgents > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">Vos agents actifs</h2>
              <p className="text-xs text-zinc-500">Cliquez pour discuter avec votre futur vous</p>
            </div>
            <button
              onClick={openAgents}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Tout voir <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {curricula.filter((c) => c.agent).map((c) => (
              <AgentMiniCard key={c.agent!.id} curriculum={c} onOpen={() => useUI.getState().openAgentChat(c.agent!.id)} />
            ))}
          </div>
        </div>
      )}

      <CreateCurriculumDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'emerald' | 'amber' | 'purple'
  onClick?: () => void
}) {
  const colorMap = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
    purple: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
  }
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border ${colorMap[color]} p-4 backdrop-blur-xl hover:scale-[1.02] transition-transform`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <Crown className="w-3 h-3 opacity-30" />
      </div>
      <div className="text-2xl font-bold tabular-nums text-zinc-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{label}</div>
    </button>
  )
}

function AgentMiniCard({ curriculum, onOpen }: { curriculum: Curriculum; onOpen: () => void }) {
  const agent = curriculum.agent!
  return (
    <button onClick={onOpen} className="group text-left w-full">
      <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Avatar
            seed={agent.id}
            domain={curriculum.domain}
            size={40}
            className="ring-2 ring-emerald-500/40"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100">{agent.name}</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px]">
                Lv {agent.level}
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-400 truncate">{agent.activity}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </button>
  )
}
