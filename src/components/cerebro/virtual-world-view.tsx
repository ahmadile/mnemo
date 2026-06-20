'use client'

import { useEffect, useRef, useState } from 'react'
import { useUI } from '@/store/ui'
import { Button } from '@/components/ui/button'
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

// Emoji characters for characters in the 2D world
// Each NPC gets a character emoji based on their kind/domain
const NPC_EMOJIS: Record<string, string> = {
  'quest-giver': '🧙‍♂️',  // wizard for quest giver
  'npc-1': '🧝‍♂️',       // elf sage
  'npc-2': '🧑‍🏫',       // teacher mentor
  'npc-3': '📚',         // archive books
}
const AGENT_EMOJIS = ['🤖', '🦾', '🧠', '👁️', '🦿']  // for AI agents
const PLAYER_EMOJI = '🧑‍🚀'  // astronaut = explorer

// Phaser is loaded dynamically on client-side only
// (it uses `window` and shouldn't be SSR'd)

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
}

interface PhaserGameRef {
  destroy: () => void
  getPlayerPos: () => { x: number; y: number }
  setNearbyNpcCallback: (cb: (npc: Npc | null) => void) => void
  triggerInteraction: () => void
  setChatOpen: (open: boolean) => void
}

const GAME_W = 900
const GAME_H = 560

export function VirtualWorldView() {
  const goDashboard = useUI((s) => s.goDashboard)
  const openAgentChat = useUI((s) => s.openAgentChat)
  const phaserContainerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<PhaserGameRef | null>(null)

  const [npcs, setNpcs] = useState<Npc[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNpc, setActiveNpc] = useState<Npc | null>(null)
  const [nearbyNpc, setNearbyNpc] = useState<Npc | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'agent'; content: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)

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
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Initialize Phaser game
  useEffect(() => {
    if (loading || npcs.length === 0 || !phaserContainerRef.current) return
    if (gameRef.current) return // already initialized

    let destroyed = false

    // Dynamic import to avoid SSR issues
    import('phaser').then((Phaser) => {
      if (destroyed) return

      const nearbyCallbackRef = { current: (_npc: Npc | null) => {} }
      // Ref to know if chat is open (shared with Phaser scene to disable movement)
      const chatOpenRef = { current: false }

      class MnemoScene extends Phaser.Scene {
        player!: Phaser.GameObjects.Container
        playerCircle!: Phaser.GameObjects.Arc
        playerLabel!: Phaser.GameObjects.Text
        playerEmoji!: Phaser.GameObjects.Text
        playerShadow!: Phaser.GameObjects.Ellipse
        npcObjects: Map<string, { container: Phaser.GameObjects.Container; circle: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text; data: Npc }> = new Map()
        cursors!: Phaser.Types.Input.Keyboard.CursorKeys
        wasd!: Record<string, Phaser.Input.Keyboard.Key>
        bubbles: Map<string, Phaser.GameObjects.Container> = new Map()
        nearbyIndicator!: Phaser.GameObjects.Arc
        keysE!: Phaser.Input.Keyboard.Key

        constructor() {
          super({ key: 'mnemo' })
        }

        preload() {
          // No external assets to load — we use emoji text as characters
        }

        create() {
          const W = GAME_W
          const H = GAME_H

          // --- Background: dark with grid ---
          const g = this.add.graphics()
          g.fillStyle(0x0d1117, 1)
          g.fillRect(0, 0, W, H)
          // Grid
          g.lineStyle(0.5, 0x1a1f2e, 0.6)
          for (let x = 0; x < W; x += 32) {
            g.lineBetween(x, 0, x, H)
          }
          for (let y = 0; y < H; y += 32) {
            g.lineBetween(0, y, W, y)
          }

          // --- Zones (4 corners) ---
          const zones = [
            { x: 0, y: 0, w: 220, h: 160, color: 0x3b82f6, alpha: 0.12, label: 'PYTHON' },
            { x: W - 220, y: 0, w: 220, h: 160, color: 0x10b981, alpha: 0.12, label: 'SQL' },
            { x: 0, y: H - 160, w: 220, h: 160, color: 0xa855f7, alpha: 0.12, label: 'IA' },
            { x: W - 220, y: H - 160, w: 220, h: 160, color: 0xf59e0b, alpha: 0.12, label: 'DATA' },
          ]
          zones.forEach((z) => {
            const zoneG = this.add.graphics()
            zoneG.fillStyle(z.color, z.alpha)
            zoneG.fillRect(z.x, z.y, z.w, z.h)
            zoneG.lineStyle(1, z.color, 0.4)
            zoneG.strokeRect(z.x, z.y, z.w, z.h)
            this.add.text(z.x + 10, z.y + 10, z.label, {
              fontFamily: 'sans-serif',
              fontSize: '12px',
              color: '#' + z.color.toString(16).padStart(6, '0'),
              fontStyle: 'bold',
            })
          })

          // --- Central plaza ---
          const plazaG = this.add.graphics()
          plazaG.fillStyle(0x10b981, 0.06)
          plazaG.fillCircle(W / 2, H / 2, 90)
          plazaG.lineStyle(1, 0x10b981, 0.3)
          plazaG.strokeCircle(W / 2, H / 2, 90)
          this.add.text(W / 2, H / 2, 'PLACE CENTRALE', {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            color: '#10b981',
            align: 'center',
          }).setOrigin(0.5)

          // --- NPCs ---
          npcs.forEach((npc) => {
            this.createNpc(npc)
          })

          // --- Player (emoji character with walk animation) ---
          this.player = this.add.container(W / 2, H / 2)
          // Shadow (animated, scales with bobbing)
          const playerShadow = this.add.ellipse(0, 22, 36, 12, 0x000000, 0.5)
          // Glow ring (emerald)
          const playerRing = this.add.circle(0, 0, 24, 0x10b981, 0.15)
          playerRing.setStrokeStyle(2, 0x10b981, 0.8)
          // Emoji character
          const playerEmoji = this.add.text(0, 0, PLAYER_EMOJI, {
            fontFamily: 'sans-serif',
            fontSize: '36px',
          }).setOrigin(0.5)
          // Label
          this.playerLabel = this.add.text(0, -32, 'VOUS', {
            fontFamily: 'sans-serif',
            fontSize: '11px',
            color: '#10b981',
            fontStyle: 'bold',
          }).setOrigin(0.5)

          this.player.add([playerShadow, playerRing, playerEmoji, this.playerLabel])
          this.playerShadow = playerShadow
          this.playerEmoji = playerEmoji

          // Idle bobbing animation
          this.tweens.add({
            targets: playerEmoji,
            y: { from: -2, to: 2 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
          // Shadow pulse with bob
          this.tweens.add({
            targets: playerShadow,
            scaleX: { from: 1, to: 0.85 },
            scaleY: { from: 1, to: 0.85 },
            alpha: { from: 0.5, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })

          // Aura (pulsing)
          const aura = this.add.circle(W / 2, H / 2, 28, 0x10b981, 0.15)
          this.tweens.add({
            targets: aura,
            scale: { from: 1, to: 1.4 },
            alpha: { from: 0.3, to: 0 },
            duration: 1500,
            repeat: -1,
            ease: 'Sine.easeOut',
          })
          aura.setPosition(W / 2, H / 2)
          // Keep aura behind player
          this.children.bringToTop(this.player)

          // --- Nearby indicator (dashed circle) ---
          this.nearbyIndicator = this.add.circle(0, 0, 26, 0x000000, 0)
          this.nearbyIndicator.setStrokeStyle(2, 0x10b981, 0.8)
          this.nearbyIndicator.setVisible(false)

          // --- Input ---
          if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys()
            this.wasd = this.input.keyboard.addKeys({
              up: Phaser.Input.Keyboard.KeyCodes.W,
              down: Phaser.Input.Keyboard.KeyCodes.S,
              left: Phaser.Input.Keyboard.KeyCodes.A,
              right: Phaser.Input.Keyboard.KeyCodes.D,
            }) as any
            this.keysE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)

            // E key to interact
            this.input.keyboard.on('keydown-E', () => {
              this.triggerInteraction()
            })
            // ESC to close chat
            this.input.keyboard.on('keydown-ESC', () => {
              if (activeNpcRef.current) {
                setActiveNpc(null)
                setChatHistory([])
              }
            })
          }

          // Click on NPC to interact
          this.input.on('gameobjectdown', (_pointer: any, gameObject: any) => {
            const npcId = gameObject.getData('npcId')
            if (npcId) {
              const npcData = this.npcObjects.get(npcId)
              if (npcData) {
                this.interactWith(npcData.data)
              }
            }
          })
        }

        createNpc(npc: Npc) {
          const container = this.add.container(npc.x, npc.y)
          const isQuestGiver = npc.kind === 'quest-giver'
          const colorNum = parseInt(npc.color.replace('#', ''), 16)

          // Shadow (animated)
          const shadow = this.add.ellipse(0, 20, 30, 10, 0x000000, 0.5)

          // Glow ring for agents
          if (npc.kind === 'agent') {
            const ring = this.add.circle(0, 0, 22, colorNum, 0.1)
            ring.setStrokeStyle(2, colorNum, 0.6)
            container.add(ring)
            // Rotating dashed ring
            const dashRing = this.add.circle(0, 0, 26, 0x000000, 0)
            dashRing.setStrokeStyle(1, colorNum, 0.4)
            this.tweens.add({
              targets: dashRing,
              angle: 360,
              duration: 8000,
              repeat: -1,
            })
            container.add(dashRing)
          } else if (isQuestGiver) {
            const ring = this.add.circle(0, 0, 22, 0xfbbf24, 0.1)
            ring.setStrokeStyle(2, 0xfbbf24, 0.6)
            container.add(ring)
          }

          // Pick emoji based on NPC type
          let emoji = NPC_EMOJIS[npc.id]
          if (!emoji) {
            if (npc.kind === 'agent') {
              // Use domain-specific agent emoji
              const agentIdx = (npc.id.charCodeAt(0) || 0) % AGENT_EMOJIS.length
              emoji = AGENT_EMOJIS[agentIdx]
            } else {
              emoji = '🧑'
            }
          }

          // Emoji character (interactive)
          const emojiText = this.add.text(0, 0, emoji, {
            fontFamily: 'sans-serif',
            fontSize: '32px',
          }).setOrigin(0.5)
          emojiText.setInteractive({ useHandCursor: true })
          emojiText.setData('npcId', npc.id)

          // Idle bobbing animation (different phase per NPC)
          const bobDelay = Math.random() * 1000
          this.tweens.add({
            targets: emojiText,
            y: { from: -2, to: 2 },
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: bobDelay,
          })
          // Shadow sync
          this.tweens.add({
            targets: shadow,
            scaleX: { from: 1, to: 0.85 },
            alpha: { from: 0.5, to: 0.3 },
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: bobDelay,
          })

          // Name label
          const label = this.add.text(0, -28, npc.name, {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            color: '#ffffff',
            fontStyle: 'bold',
          }).setOrigin(0.5)
          // Level badge for agents
          if (npc.kind === 'agent' && npc.level) {
            const levelText = this.add.text(0, -36, `Lv${npc.level}`, {
              fontFamily: 'sans-serif',
              fontSize: '9px',
              color: '#10b981',
            }).setOrigin(0.5)
            container.add(levelText)
          }
          // Quest marker (yellow !) floating
          if (isQuestGiver) {
            const questMark = this.add.text(0, -42, '!', {
              fontFamily: 'sans-serif',
              fontSize: '18px',
              color: '#fbbf24',
              fontStyle: 'bold',
            }).setOrigin(0.5)
            this.tweens.add({
              targets: questMark,
              y: { from: -42, to: -48 },
              duration: 700,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
            container.add(questMark)
          }

          container.add([shadow, emojiText, label])
          this.npcObjects.set(npc.id, { container, circle: emojiText as any, label, data: npc })

          // Wander behavior: tween to random nearby position
          this.scheduleWander(npc.id)
        }

        scheduleWander(npcId: string) {
          const npcObj = this.npcObjects.get(npcId)
          if (!npcObj) return
          const delay = 2000 + Math.random() * 4000
          this.time.delayedCall(delay, () => {
            const stillExists = this.npcObjects.get(npcId)
            if (!stillExists) return
            const newX = Phaser.Math.Clamp(npcObj.data.x + (Math.random() - 0.5) * 250, 50, GAME_W - 50)
            const newY = Phaser.Math.Clamp(npcObj.data.y + (Math.random() - 0.5) * 250, 50, GAME_H - 50)
            npcObj.data.x = newX
            npcObj.data.y = newY
            this.tweens.add({
              targets: npcObj.container,
              x: newX,
              y: newY,
              duration: 2500 + Math.random() * 2000,
              ease: 'Sine.easeInOut',
              onComplete: () => this.scheduleWander(npcId),
            })
          })
        }

        triggerInteraction() {
          const nearby = this.findNearbyNpc()
          if (nearby) {
            this.interactWith(nearby)
          }
        }

        interactWith(npc: Npc) {
          // Show speech bubble
          this.showBubble(npc.id, npc.dialogue || npc.activity || 'Bonjour !', npc.color)
          // Tell React
          interactNpcCallbackRef.current(npc)
        }

        findNearbyNpc(): Npc | null {
          const px = this.player.x
          const py = this.player.y
          let closest: Npc | null = null
          let minDist = 70
          this.npcObjects.forEach((obj) => {
            const d = Phaser.Math.Distance.Between(px, py, obj.data.x, obj.data.y)
            if (d < minDist) {
              minDist = d
              closest = obj.data
            }
          })
          return closest
        }

        showBubble(npcId: string, text: string, color: string) {
          // Remove existing bubble for this NPC
          const existing = this.bubbles.get(npcId)
          if (existing) existing.destroy()

          const npcObj = this.npcObjects.get(npcId)
          if (!npcObj) return

          const truncated = text.length > 30 ? text.slice(0, 28) + '…' : text
          const bubble = this.add.container(npcObj.data.x, npcObj.data.y - 50)

          const textStyle = { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff' }
          const txt = this.add.text(0, 0, truncated, textStyle).setOrigin(0.5)
          const w = txt.width + 20
          const h = 26

          const bg = this.add.graphics()
          bg.fillStyle(0x1a1a1a, 1)
          bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6)
          bg.lineStyle(1.5, parseInt(color.replace('#', ''), 16), 1)
          bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6)
          // Tail
          bg.fillStyle(0x1a1a1a, 1)
          bg.beginPath()
          bg.moveTo(-4, h / 2)
          bg.lineTo(0, h / 2 + 5)
          bg.lineTo(4, h / 2)
          bg.closePath()
          bg.fillPath()

          bubble.add([bg, txt])
          this.bubbles.set(npcId, bubble)

          // Auto-remove after 4s
          this.time.delayedCall(4000, () => {
            if (bubble && bubble.active) bubble.destroy()
            this.bubbles.delete(npcId)
          })
        }

        update() {
          if (!this.player || !this.cursors) return

          // Disable movement when chat is open (so user can type freely)
          if (chatOpenRef.current) {
            // Reset any movement state
            this.playerEmoji?.setRotation(0)
            return
          }

          // Movement
          const speed = 3.5
          let dx = 0
          let dy = 0
          if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1
          if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1
          if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1
          if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1

          const isMoving = dx !== 0 || dy !== 0

          if (isMoving) {
            // Normalize
            const len = Math.sqrt(dx * dx + dy * dy)
            dx = (dx / len) * speed
            dy = (dy / len) * speed
            this.player.x = Phaser.Math.Clamp(this.player.x + dx, 20, GAME_W - 20)
            this.player.y = Phaser.Math.Clamp(this.player.y + dy, 20, GAME_H - 20)

            // Walking animation: tilt emoji in movement direction
            if (this.playerEmoji) {
              const tilt = dx * 0.02
              this.playerEmoji.setRotation(tilt)
              // Bounce effect while walking
              const bounce = Math.sin(this.time.now / 80) * 3
              this.playerEmoji.y = bounce
            }
            // Shadow shrinks slightly when "in air"
            if (this.playerShadow) {
              const bounce = Math.abs(Math.sin(this.time.now / 80))
              this.playerShadow.setScale(1 - bounce * 0.2)
              this.playerShadow.setAlpha(0.5 - bounce * 0.2)
            }
          } else {
            // Idle: reset rotation, let the idle tween handle bobbing
            if (this.playerEmoji) {
              this.playerEmoji.setRotation(0)
            }
          }

          // Check nearby NPC
          const nearby = this.findNearbyNpc()
          nearbyCallbackRef.current(nearby)
          if (nearby) {
            this.nearbyIndicator.setVisible(true)
            this.nearbyIndicator.setPosition(nearby.x, nearby.y)
            // Pulse
            const pulse = 1 + Math.sin(this.time.now / 200) * 0.1
            this.nearbyIndicator.setScale(pulse)
          } else {
            this.nearbyIndicator.setVisible(false)
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: GAME_W,
        height: GAME_H,
        parent: phaserContainerRef.current,
        backgroundColor: '#0d1117',
        scene: [MnemoScene],
        physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      }

      const game = new Phaser.Game(config)

      // Expose API to React
      gameRef.current = {
        destroy: () => game.destroy(true),
        getPlayerPos: () => {
          const scene = game.scene.scenes[0] as MnemoScene
          return { x: scene?.player?.x || 0, y: scene?.player?.y || 0 }
        },
        setNearbyNpcCallback: (cb) => { nearbyCallbackRef.current = cb },
        triggerInteraction: () => {
          const scene = game.scene.scenes[0] as MnemoScene
          scene?.triggerInteraction()
        },
        setChatOpen: (open: boolean) => {
          chatOpenRef.current = open
          // Also disable/enable keyboard capture on the Phaser scene
          const scene = game.scene.scenes[0] as MnemoScene
          if (scene?.input?.keyboard) {
            scene.input.keyboard.enabled = !open
          }
        },
      }

      // Wire nearby callback to React state
      gameRef.current.setNearbyNpcCallback((npc) => {
        setNearbyNpc(npc)
      })
    })

    return () => {
      destroyed = true
      if (gameRef.current) {
        gameRef.current.destroy()
        gameRef.current = null
      }
    }
  }, [loading, npcs])

  // Refs for callbacks that need latest state
  const activeNpcRef = useRef<Npc | null>(null)
  const interactNpcCallbackRef = useRef<(npc: Npc) => void>(() => {})
  useEffect(() => { activeNpcRef.current = activeNpc }, [activeNpc])

  // Sync chat open state with Phaser to disable movement while typing
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setChatOpen(!!activeNpc)
    }
  }, [activeNpc])

  // Setup interaction handler
  useEffect(() => {
    interactNpcCallbackRef.current = (npc: Npc) => {
      setActiveNpc(npc)
      setChatHistory([])
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
  }, [])

  async function sendChatMessage() {
    if (!activeNpc || !chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatHistory((h) => [...h, { role: 'user', content: msg }])
    setChatLoading(true)

    // Show bubble in game
    if (gameRef.current) {
      // We'll add a method to show user bubble - for now, just the agent response
    }

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
        // Show bubble in game
        if (gameRef.current) {
          // The scene's showBubble method - we'll use a simpler approach
          // by calling the scene directly
        }
      } else {
        const responses: Record<string, string> = {
          'quest-giver': 'Pour une mission, retourne sur la Carte et choisis un cursus !',
          'npc-1': 'Continue à apprendre, les agents naîtront.',
          'npc-2': 'Le savoir oublié revient quand tu réveilles un agent.',
          'npc-3': 'Chaque mission est un pas vers une nouvelle compétence.',
        }
        const response = responses[activeNpc.id] || activeNpc.dialogue || '...'
        await new Promise((r) => setTimeout(r, 600))
        setChatHistory((h) => [...h, { role: 'agent', content: response }])
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* Top bar */}
      <div className="px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between gap-3">
        <button
          onClick={goDashboard}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la carte
        </button>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">
            <Gamepad2 className="w-2.5 h-2.5 mr-1" />
            Phaser.js · RPG Engine
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
            <Keyboard className="w-2.5 h-2.5 mr-1" />
            ZQSD/Flèches · E pour parler
          </Badge>
          <Badge className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[10px]">
            <Users className="w-2.5 h-2.5 mr-1" />
            {npcs.length} habitants
          </Badge>
        </div>
      </div>

      {/* Main split: canvas + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Phaser game area */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950 flex items-center justify-center p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="relative">
              <div
                ref={phaserContainerRef}
                className="border border-zinc-800 rounded-lg overflow-hidden"
                style={{ width: GAME_W, height: GAME_H, maxWidth: '100%' }}
              />

              {/* Interaction prompt */}
              {nearbyNpc && !activeNpc && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-zinc-900 border border-emerald-500/40 text-sm flex items-center gap-2 shadow-lg z-10">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-200">
                    Appuyez sur <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] font-mono border border-zinc-700">E</kbd> ou cliquez pour parler à <strong className="text-emerald-300">{nearbyNpc.name}</strong>
                  </span>
                  <button
                    onClick={() => interactNpcCallbackRef.current(nearbyNpc)}
                    className="ml-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded"
                  >
                    Parler
                  </button>
                </div>
              )}

              {/* Click hint */}
              {!nearbyNpc && !activeNpc && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-500 backdrop-blur z-10">
                  Cliquez sur un personnage ou approchez-vous avec E
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat panel */}
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
                  onClick={() => openAgentChat(activeNpc.id)}
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
                    // Stop propagation so Phaser doesn't capture the key
                    e.stopPropagation()
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  // Auto-focus when chat opens
                  autoFocus
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
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              Moteur <strong className="text-purple-300">Phaser.js</strong> — déplacements fluides,
              sprites animés, bulles de discussion.
            </p>
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Promenez-vous avec ZQSD ou les flèches. Approchez d'un personnage et appuyez sur E
              pour discuter. Vos agents-mémoire apparaissent ici automatiquement.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
