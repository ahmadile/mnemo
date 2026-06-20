'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useUI } from '@/store/ui'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Gamepad2,
  Loader2,
  Send,
  MessageCircle,
  X,
  Users,
  Sparkles,
  Keyboard,
} from 'lucide-react'
import { toast } from 'sonner'

interface Npc {
  id: string
  kind: 'agent' | 'npc' | 'quest-giver'
  name: string
  color: string
  x: number
  y: number
  level?: number
  domain?: string
  activity?: string
  dialogue?: string
  conversation?: { role: string; content: string }[]
}

interface Bubble {
  id: string
  npcId: string
  text: string
  color: string
  expires: number
}

const CANVAS_W = 900
const CANVAS_H = 560
const TILE = 32
const PLAYER_SPEED = 3
const NPC_SPEED = 0.8

export function VirtualWorldView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const openAgentChat = useUI((s) => s.openAgentChat)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [npcs, setNpcs] = useState<Npc[]>([])
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState({ x: 400, y: 300, color: '#10b981' })
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [activeNpc, setActiveNpc] = useState<Npc | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'agent'; content: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [nearbyNpc, setNearbyNpc] = useState<Npc | null>(null)

  // Input state (keyboard)
  const keys = useRef<{ [k: string]: boolean }>({})

  // Load NPCs
  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/virtual-world')
      const data = await res.json()
      setNpcs(data.npcs || [])
      setPlayer(data.player || { x: 400, y: 300, color: '#10b981' })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Keyboard listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (activeNpc && document.activeElement?.tagName !== 'INPUT') {
        if (e.key === 'Escape') setActiveNpc(null)
        return
      }
      if (document.activeElement?.tagName === 'INPUT') return
      keys.current[e.key.toLowerCase()] = true
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [activeNpc])

  // Game loop
  useEffect(() => {
    if (loading || npcs.length === 0) return
    let raf: number
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now

      // Update player position
      setPlayer((p) => {
        let { x, y } = p
        if (keys.current['arrowup'] || keys.current['w']) y -= PLAYER_SPEED
        if (keys.current['arrowdown'] || keys.current['s']) y += PLAYER_SPEED
        if (keys.current['arrowleft'] || keys.current['a']) x -= PLAYER_SPEED
        if (keys.current['arrowright'] || keys.current['d']) x += PLAYER_SPEED
        x = Math.max(20, Math.min(CANVAS_W - 20, x))
        y = Math.max(20, Math.min(CANVAS_H - 20, y))
        return { ...p, x, y }
      })

      // NPC wander behavior
      setNpcs((prev) =>
        prev.map((n) => {
          if (Math.random() < 0.02) {
            // Pick new target
            return {
              ...n,
              _targetX: Math.max(40, Math.min(CANVAS_W - 40, n.x + (Math.random() - 0.5) * 200)),
              _targetY: Math.max(40, Math.min(CANVAS_H - 40, n.y + (Math.random() - 0.5) * 200)),
            } as Npc
          }
          const tx = (n as any)._targetX
          const ty = (n as any)._targetY
          if (tx === undefined || ty === undefined) return n
          const dx = tx - n.x
          const dy = ty - n.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 5) return n
          return {
            ...n,
            x: n.x + (dx / dist) * NPC_SPEED,
            y: n.y + (dy / dist) * NPC_SPEED,
          }
        })
      )

      // Check nearby NPC for interaction
      setPlayer((p) => {
        let closest: Npc | null = null
        let minDist = 60
        for (const n of npcs) {
          const d = Math.sqrt((n.x - p.x) ** 2 + (n.y - p.y) ** 2)
          if (d < minDist) {
            minDist = d
            closest = n
          }
        }
        setNearbyNpc(closest)
        return p
      })

      // Expire bubbles
      const nowTs = Date.now()
      setBubbles((bs) => bs.filter((b) => b.expires > nowTs))

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [loading, npcs])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Grid
    ctx.strokeStyle = '#1a1f2e'
    ctx.lineWidth = 0.5
    for (let x = 0; x < CANVAS_W; x += TILE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_H)
      ctx.stroke()
    }
    for (let y = 0; y < CANVAS_H; y += TILE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_W, y)
      ctx.stroke()
    }

    // Zones (4 corners with colors)
    const zones = [
      { x: 0, y: 0, w: 200, h: 150, color: '#3b82f620', label: 'PYTHON', textColor: '#3b82f6' },
      { x: CANVAS_W - 200, y: 0, w: 200, h: 150, color: '#10b98120', label: 'SQL', textColor: '#10b981' },
      { x: 0, y: CANVAS_H - 150, w: 200, h: 150, color: '#a855f720', label: 'IA', textColor: '#a855f7' },
      { x: CANVAS_W - 200, y: CANVAS_H - 150, w: 200, h: 150, color: '#f59e0b20', label: 'DATA', textColor: '#f59e0b' },
    ]
    zones.forEach((z) => {
      ctx.fillStyle = z.color
      ctx.fillRect(z.x, z.y, z.w, z.h)
      ctx.fillStyle = z.textColor
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(z.label, z.x + 8, z.y + 18)
    })

    // Center: plaza
    ctx.fillStyle = '#10b98108'
    ctx.beginPath()
    ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 80, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#10b98130'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = '#10b98180'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PLACE CENTRALE', CANVAS_W / 2, CANVAS_H / 2 + 4)
    ctx.textAlign = 'left'

    // Render NPCs
    npcs.forEach((n) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.beginPath()
      ctx.ellipse(n.x, n.y + 14, 14, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Body (circle with color)
      ctx.fillStyle = n.color
      ctx.beginPath()
      ctx.arc(n.x, n.y, 14, 0, Math.PI * 2)
      ctx.fill()

      // Border
      ctx.strokeStyle = n.kind === 'quest-giver' ? '#fbbf24' : '#ffffff80'
      ctx.lineWidth = n.kind === 'quest-giver' ? 2 : 1
      ctx.stroke()

      // Initial letter
      ctx.fillStyle = '#0a0a0a'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(n.name.charAt(0).toUpperCase(), n.x, n.y)

      // Name label above
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textBaseline = 'bottom'
      const nameY = n.y - 22
      ctx.fillText(n.name, n.x, nameY)

      // Level badge for agents
      if (n.kind === 'agent' && n.level) {
        ctx.fillStyle = '#10b981'
        ctx.font = '9px sans-serif'
        ctx.fillText(`Lv${n.level}`, n.x, nameY - 10)
      }

      // Quest marker (yellow !) for quest-giver
      if (n.kind === 'quest-giver') {
        const t = Date.now() / 500
        const bob = Math.sin(t) * 2
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('!', n.x, n.y - 32 + bob)
      }

      // Nearby indicator
      if (nearbyNpc?.id === n.id) {
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(n.x, n.y, 22, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })

    // Render player
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.beginPath()
    ctx.ellipse(player.x, player.y + 16, 16, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Player aura
    const auraGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 24)
    auraGrad.addColorStop(0, '#10b98130')
    auraGrad.addColorStop(1, '#10b98100')
    ctx.fillStyle = auraGrad
    ctx.beginPath()
    ctx.arc(player.x, player.y, 24, 0, Math.PI * 2)
    ctx.fill()

    // Player body
    ctx.fillStyle = player.color
    ctx.beginPath()
    ctx.arc(player.x, player.y, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Player letter
    ctx.fillStyle = '#0a0a0a'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('M', player.x, player.y)

    // "VOUS" label
    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 10px sans-serif'
    ctx.textBaseline = 'bottom'
    ctx.fillText('VOUS', player.x, player.y - 26)

    // Render bubbles
    bubbles.forEach((b) => {
      const npc = npcs.find((n) => n.id === b.npcId)
      if (!npc) return
      const text = b.text
      ctx.font = '11px sans-serif'
      const metrics = ctx.measureText(text)
      const w = Math.min(metrics.width + 16, 200)
      const h = 24
      const bx = npc.x - w / 2
      const by = npc.y - 55

      // Bubble background
      ctx.fillStyle = '#1a1a1a'
      ctx.strokeStyle = b.color
      ctx.lineWidth = 1.5
      roundRect(ctx, bx, by, w, h, 6)
      ctx.fill()
      ctx.stroke()

      // Tail
      ctx.beginPath()
      ctx.moveTo(npc.x - 4, by + h)
      ctx.lineTo(npc.x, by + h + 5)
      ctx.lineTo(npc.x + 4, by + h)
      ctx.fillStyle = '#1a1a1a'
      ctx.fill()
      ctx.strokeStyle = b.color
      ctx.stroke()

      // Text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text.slice(0, 30), npc.x, by + h / 2)
    })

    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }, [npcs, player, bubbles, nearbyNpc])

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function showBubble(npcId: string, text: string, color: string) {
    const bubble: Bubble = {
      id: `b-${Date.now()}-${Math.random()}`,
      npcId,
      text,
      color,
      expires: Date.now() + 5000,
    }
    setBubbles((bs) => [...bs, bubble])
  }

  function interactWithNpc(npc: Npc) {
    setActiveNpc(npc)
    setChatHistory([])
    // Show intro bubble
    if (npc.dialogue) {
      showBubble(npc.id, npc.dialogue.slice(0, 40), npc.color)
    } else if (npc.activity) {
      showBubble(npc.id, npc.activity.slice(0, 40), npc.color)
    }
    // For agents, fetch conversation history
    if (npc.kind === 'agent') {
      fetch(`/api/agents/${npc.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.agent?.conversations) {
            setChatHistory(
              data.agent.conversations.map((c: any) => ({
                role: c.role === 'user' ? 'user' : 'agent',
                content: c.content,
              }))
            )
          }
        })
        .catch(() => {})
    }
  }

  async function sendChatMessage() {
    if (!activeNpc || !chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatHistory((h) => [...h, { role: 'user', content: msg }])
    setChatLoading(true)
    showBubble(activeNpc.id, msg.slice(0, 40), '#10b981')

    try {
      if (activeNpc.kind === 'agent') {
        const res = await fetch(`/api/agents/${activeNpc.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const response = data.response
        setChatHistory((h) => [...h, { role: 'agent', content: response }])
        showBubble(activeNpc.id, response.slice(0, 40), activeNpc.color)
      } else {
        // NPC response (canned)
        const responses: Record<string, string> = {
          'quest-giver': 'Pour une mission, retourne sur la Carte et choisis un cursus !',
          'npc-1': 'Continue à apprendre, les agents naîtront.',
          'npc-2': 'Le savoir oublié revient quand tu réveilles un agent.',
          'npc-3': 'Chaque mission est un pas vers une nouvelle compétence.',
        }
        const response = responses[activeNpc.id] || activeNpc.dialogue || '...'
        await new Promise((r) => setTimeout(r, 600))
        setChatHistory((h) => [...h, { role: 'agent', content: response }])
        showBubble(activeNpc.id, response.slice(0, 40), activeNpc.color)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* Top bar inside virtual world */}
      <div className="px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between gap-3">
        <button
          onClick={goDashboard}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la carte
        </button>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
            <Keyboard className="w-2.5 h-2.5 mr-1" />
            ZQSD / Flèches pour bouger
          </Badge>
          <Badge className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[10px]">
            <Users className="w-2.5 h-2.5 mr-1" />
            {npcs.length} habitants
          </Badge>
        </div>
      </div>

      {/* Main split: canvas + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-auto bg-zinc-950 flex items-center justify-center p-4"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                tabIndex={0}
                className="border border-zinc-800 rounded-lg bg-[#0d1117] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              {/* Interaction prompt */}
              {nearbyNpc && !activeNpc && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-zinc-900 border border-emerald-500/40 text-sm flex items-center gap-2 shadow-lg">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-200">
                    Appuyez sur <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] font-mono border border-zinc-700">E</kbd> ou cliquez pour parler à <strong className="text-emerald-300">{nearbyNpc.name}</strong>
                  </span>
                  <button
                    onClick={() => interactWithNpc(nearbyNpc)}
                    className="ml-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded"
                  >
                    Parler
                  </button>
                </div>
              )}

              {/* Click hint */}
              {!nearbyNpc && !activeNpc && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-500 backdrop-blur">
                  Cliquez sur un personnage pour interagir
                </div>
              )}

              {/* Hidden E key handler */}
              <EKeyHandler onInteract={() => nearbyNpc && interactWithNpc(nearbyNpc)} disabled={!!activeNpc} />

              {/* Click-to-interact overlay */}
              <div
                className="absolute inset-0"
                style={{ pointerEvents: 'none' }}
              >
                {/* Canvas clicks handled via canvas onClick */}
              </div>
              <canvas
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const scaleX = CANVAS_W / rect.width
                  const scaleY = CANVAS_H / rect.height
                  const x = (e.clientX - rect.left) * scaleX
                  const y = (e.clientY - rect.top) * scaleY
                  // Find clicked NPC
                  const clicked = npcs.find((n) => {
                    const d = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
                    return d < 20
                  })
                  if (clicked) {
                    interactWithNpc(clicked)
                  }
                }}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto', cursor: 'pointer' }}
                width={CANVAS_W}
                height={CANVAS_H}
                className="opacity-0"
              />
            </div>
          )}
        </div>

        {/* Chat panel (right) */}
        {activeNpc && (
          <div className="w-full max-w-md border-l border-zinc-800/60 bg-zinc-900/40 flex flex-col">
            <div className="p-4 border-b border-zinc-800/60 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: activeNpc.color, color: '#0a0a0a' }}
              >
                {activeNpc.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{activeNpc.name}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {activeNpc.kind === 'agent' ? `Agent · ${activeNpc.domain} · Niv ${activeNpc.level}` : activeNpc.kind === 'quest-giver' ? 'Donneur de missions' : 'Habitant du monde'}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveNpc(null)
                  setChatHistory([])
                }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 mb-1">Démarrez la conversation</p>
                  <p className="text-[10px] text-zinc-600">
                    {activeNpc.dialogue || activeNpc.activity || 'Posez votre question...'}
                  </p>
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'bg-zinc-950/60 border border-zinc-800 text-zinc-200'
                    }`}
                    style={m.role === 'agent' ? { borderColor: `${activeNpc.color}40` } : undefined}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{activeNpc.name} réfléchit...</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/30">
              {activeNpc.kind === 'agent' && (
                <button
                  onClick={() => {
                    openAgentChat(activeNpc.id)
                  }}
                  className="w-full mb-2 text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Ouvrir le chat complet
                </button>
              )}
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  placeholder={`Parler à ${activeNpc.name}...`}
                  className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                  size="icon"
                >
                  {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state for chat panel */}
        {!activeNpc && !loading && (
          <div className="hidden md:flex w-72 border-l border-zinc-800/60 bg-zinc-900/40 flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Gamepad2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-300 mb-2">Monde Virtuel 2D</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Promenez-vous avec ZQSD ou les flèches. Approchez-vous d'un personnage pour discuter.
              Vos agents-mémoire apparaissent ici automatiquement quand ils naissent.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Hidden component to handle 'E' key for interaction
function EKeyHandler({ onInteract, disabled }: { onInteract: () => void; disabled: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        onInteract()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onInteract, disabled])
  return null
}
