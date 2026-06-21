import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateChatCompletion } from '@/lib/ai'

// POST /api/agents/[id]/chat - send message to agent
// Body: { message: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { message } = await req.json()

    if (!message || message.trim().length < 1) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        curriculum: { include: { missions: { where: { status: 'completed' } } } },
        conversations: { orderBy: { createdAt: 'asc' }, take: 20 },
      },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })
    }

    const skills = JSON.parse(agent.skills)
    const completedMissions = agent.curriculum.missions.map((m) => ({
      title: m.title,
      objectives: JSON.parse(m.objectives),
    }))

    const systemPrompt = `${agent.persona}

CONTEXTE DE L'AGENT:
- Domaine de compétence: ${agent.curriculum.name} (${agent.curriculum.domain})
- Niveau: ${agent.level}
- XP totale: ${agent.totalXp}
- Compétences acquises: ${skills.join(', ')}
- Missions déjà accomplies: ${completedMissions.map((m) => m.title).join(', ') || "aucune pour l'instant"}

RÔLE:
Tu es la mémoire virtuelle de l'utilisateur dans ce domaine. Tu réponds À LA PREMIÈRE PERSONNE,
comme si tu étais lui-même dans le futur, qui se souvient de ce qu'il a appris.
- Utilise un ton naturel, conversationnel, comme un(e) ami(e) qui explique.
- Adapte le niveau de détail à son niveau actuel (niveau ${agent.level}).
- Quand il demande un rappel, rappelle-toi des notions via les missions accomplies.
- Quand il demande ton avis, donne-le franchement, comme un futur toi le ferait.
- Réponds en français, de façon concise (2-6 phrases sauf si on te demande du détail).
- N'utilise jamais de formulations comme "en tant qu'IA" ou "je suis un agent". Tu es l'utilisateur futur, point.`

    const llmMessages: { role: 'assistant' | 'user'; content: string }[] = [
      { role: 'assistant', content: systemPrompt },
    ]

    for (const conv of agent.conversations) {
      llmMessages.push({
        role: conv.role === 'user' ? 'user' : 'assistant',
        content: conv.content,
      })
    }
    llmMessages.push({ role: 'user', content: message })

    await db.agentConversation.create({
      data: { agentId: id, role: 'user', content: message },
    })

    const agentResponse = await generateChatCompletion(llmMessages)

    await db.agentConversation.create({
      data: { agentId: id, role: 'agent', content: agentResponse },
    })

    return NextResponse.json({ response: agentResponse })
  } catch (e: any) {
    console.error('POST /api/agents/[id]/chat error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
