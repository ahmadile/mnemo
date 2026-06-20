'use client'

import { useEffect, useState, useRef } from 'react'
import { useUI } from '@/store/ui'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/cerebro/avatar'
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

interface Conversation {
  id: string
  role: 'user' | 'agent'
  content: string
  createdAt: string
}

interface Agent {
  id: string
  name: string
  persona: string
  skills: string
  totalXp: number
  level: number
  status: string
  activity: string
  curriculum: {
    name: string
    domain: string
    color: string
    icon: string
  }
  conversations: Conversation[]
}

const domainInitials: Record<string, string> = {
  python: 'PY',
  sql: 'SQ',
  'ai-engineering': 'AI',
  'data-science': 'DS',
  'web-dev': 'WB',
}

export function AgentChatView() {
  const agentId = useUI((s) => s.activeAgentId)
  const openAgents = useUI((s) => s.openAgents)

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!agentId) {
      openAgents()
      return
    }
    refresh()
  }, [agentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agent?.conversations.length])

  async function refresh() {
    if (!agentId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/agents/${agentId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAgent(data.agent)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!agentId || !message.trim() || sending) return
    const msg = message.trim()
    setMessage('')
    setSending(true)

    // Optimistic: append user message locally
    const optimisticUser: Conversation = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    }
    setAgent((prev) =>
      prev
        ? { ...prev, conversations: [...prev.conversations, optimisticUser] }
        : prev
    )

    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Append agent response locally (avoid full refetch)
      const optimisticAgent: Conversation = {
        id: `temp-agent-${Date.now()}`,
        role: 'agent',
        content: data.response,
        createdAt: new Date().toISOString(),
      }
      setAgent((prev) =>
        prev
          ? { ...prev, conversations: [...prev.conversations, optimisticAgent] }
          : prev
      )
    } catch (e: any) {
      toast.error(e.message)
      // Remove optimistic user message on failure
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              conversations: prev.conversations.filter((c) => c.id !== optimisticUser.id),
            }
          : prev
      )
      setMessage(msg)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 mb-4">Agent introuvable</p>
        <Button onClick={openAgents} variant="outline">Retour aux agents</Button>
      </div>
    )
  }

  const skills: string[] = JSON.parse(agent.skills)
  const initials =
    domainInitials[agent.curriculum.domain] || agent.name.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button
        onClick={openAgents}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour aux agents
      </button>

      {/* Agent header */}
      <Card className="relative overflow-hidden p-4 border-zinc-800/60 bg-zinc-900/40">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: agent.curriculum.color }}
        />
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              seed={agent.id}
              domain={agent.curriculum.domain}
              size={48}
              className="ring-2 ring-emerald-500/40"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-zinc-100">{agent.name}</h1>
              <Badge className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[9px]">
                Niv {agent.level}
              </Badge>
              <Badge
                className="text-[9px]"
                style={{
                  backgroundColor: `${agent.curriculum.color}20`,
                  color: agent.curriculum.color,
                  border: `1px solid ${agent.curriculum.color}40`,
                }}
              >
                {agent.curriculum.name}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 italic">
              {agent.persona}
            </p>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-zinc-800/60">
            {skills.map((s, i) => (
              <Badge
                key={i}
                className="bg-zinc-800/50 text-zinc-300 border-zinc-700/50 text-[9px]"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Conversation */}
      <Card className="border-zinc-800/60 bg-zinc-900/40 flex flex-col" style={{ minHeight: '50vh' }}>
        <div className="flex-1 p-4 overflow-y-auto max-h-[55vh]">
          {agent.conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-zinc-300 mb-2">Démarrez la conversation</h3>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed mb-4">
                Posez une question à votre agent. Il se souvient de tout ce que vous
                avez appris dans ce cursus et répondra comme votre &ldquo;vous&rdquo; du futur.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                <SuggestionButton
                  label="Qu'est-ce qu'on a appris la dernière fois ?"
                  onClick={() => setMessage("Qu'est-ce qu'on a appris la dernière fois ?")}
                />
                <SuggestionButton
                  label="Donne-moi un défi rapide"
                  onClick={() => setMessage('Donne-moi un petit défi pour vérifier mes acquis récents.')}
                />
                <SuggestionButton
                  label="Rappelle-moi les bases"
                  onClick={() => setMessage('Rappelle-moi les notions fondamentales que je dois absolument retenir.')}
                />
                <SuggestionButton
                  label="Quelle est la prochaine étape ?"
                  onClick={() => setMessage("Quelle est la prochaine étape logique pour progresser dans ce domaine ?")}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {agent.conversations.map((conv) => (
                <MessageBubble key={conv.id} conversation={conv} agentColor={agent.curriculum.color} initials={initials} agentId={agent.id} agentDomain={agent.curriculum.domain} />
              ))}
              {sending && (
                <div className="flex items-start gap-3">
                  <Avatar
                    seed={agent.id}
                    domain={agent.curriculum.domain}
                    size={32}
                    className="flex-shrink-0"
                  />
                  <div className="bg-zinc-800/50 rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/30">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Parlez à ${agent.name}...`}
              disabled={sending}
              className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
              size="icon"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-[10px] text-zinc-600 text-center flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" />
        Votre agent répond à la première personne comme votre &ldquo;vous&rdquo; du futur
      </p>
    </div>
  )
}

function SuggestionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-left px-3 py-2 rounded-md border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
    >
      {label}
    </button>
  )
}

function MessageBubble({
  conversation,
  agentColor,
  initials,
  agentId,
  agentDomain,
}: {
  conversation: Conversation
  agentColor: string
  initials: string
  agentId?: string
  agentDomain?: string
}) {
  const isUser = conversation.role === 'user'
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 bg-zinc-700 text-zinc-300">
          VOUS
        </div>
      ) : (
        <Avatar
          seed={agentId || 'agent'}
          domain={agentDomain}
          size={32}
          className="flex-shrink-0"
        />
      )}
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-zinc-800 text-zinc-100'
            : 'bg-zinc-900/60 border border-zinc-800 text-zinc-200'
        }`}
        style={
          !isUser
            ? { borderColor: `${agentColor}30` }
            : undefined
        }
      >
        <p className="whitespace-pre-wrap">{conversation.content}</p>
      </div>
    </div>
  )
}
