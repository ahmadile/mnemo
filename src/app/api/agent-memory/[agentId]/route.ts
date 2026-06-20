import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getModel } from '@/lib/mastra/agent'
import { generateText } from 'ai'

// POST /api/agent-memory/[agentId]
// Body: { message: string }
// Uses Mastra-style memory: loads full conversation history from DB,
// sends to LLM with system prompt, stores response back to DB.
// This gives persistent memory per agent without external services.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const { message } = await req.json()

    if (!message || message.trim().length < 1) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    // Load agent with curriculum context
    const agent = await db.agent.findUnique({
      where: { id: agentId },
      include: {
        curriculum: {
          include: {
            missions: {
              where: { status: 'completed' },
              select: { id: true, title: true, objectives: true, sourceContent: true },
            },
          },
        },
        conversations: {
          orderBy: { createdAt: 'asc' },
          take: 30, // Last 30 messages for context window
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })
    }

    const skills = JSON.parse(agent.skills)
    const completedMissions = agent.curriculum.missions.map((m) => ({
      title: m.title,
      objectives: JSON.parse(m.objectives),
      summary: m.sourceContent?.slice(0, 200) || '',
    }))

    // Build the system prompt with agent persona + memory context
    const systemPrompt = `${agent.persona}

CONTEXTE DE L'AGENT:
- Domaine: ${agent.curriculum.name}
- Niveau: ${agent.level}
- XP totale: ${agent.totalXp}
- Compétences: ${skills.join(', ')}
- Missions accomplies: ${completedMissions.length}
${completedMissions.length > 0 ? '- Détail des missions:\n' + completedMissions.map((m, i) => `  ${i + 1}. ${m.title}: ${m.objectives.join(', ')}`).join('\n') : ''}

RÔLE:
Tu es la mémoire virtuelle de l'utilisateur dans ce domaine. Tu réponds À LA PREMIÈRE PERSONNE,
comme si tu étais lui-même dans le futur, qui se souvient de ce qu'il a appris.
- Ton naturel, conversationnel, comme un(e) ami(e) qui explique.
- Adapte le niveau de détail au niveau actuel (niveau ${agent.level}).
- Quand il demande un rappel, rappelle les notions via les missions accomplies.
- Quand il demande ton avis, donne-le franchement, comme un futur toi le ferait.
- Réponds en français, concise (2-6 phrases sauf si détail demandé).
- N'utilise jamais "en tant qu'IA" ou "je suis un agent". Tu es l'utilisateur futur, point.

MÉMOIRE:
Tu as accès à l'historique des ${agent.conversations.length} derniers messages avec cet utilisateur.
Utilise-le pour maintenir la continuité et te souvenir des discussions précédentes.`

    // Build LLM message history
    const llmMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add conversation history (memory)
    for (const conv of agent.conversations) {
      llmMessages.push({
        role: conv.role === 'user' ? 'user' : 'assistant',
        content: conv.content,
      })
    }
    llmMessages.push({ role: 'user', content: message })

    // Save user message to DB (persistent memory)
    await db.agentConversation.create({
      data: { agentId, role: 'user', content: message },
    })

    // Call LLM via AI SDK (Mastra-style)
    let agentResponse: string
    try {
      const model = getModel()
      const result = await generateText({
        model,
        messages: llmMessages,
        maxTokens: 500,
        temperature: 0.7,
      })
      agentResponse = result.text || '...'
    } catch (e: any) {
      console.error('LLM call failed, falling back to z-ai-web-dev-sdk:', e)
      // Fallback to z-ai-web-dev-sdk
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: llmMessages.map((m) => ({
          role: m.role === 'system' ? 'assistant' : m.role,
          content: m.content,
        })) as any,
        thinking: { type: 'disabled' },
      })
      agentResponse = completion.choices[0]?.message?.content || '...'
    }

    // Save agent response to DB (persistent memory)
    await db.agentConversation.create({
      data: { agentId, role: 'agent', content: agentResponse },
    })

    // Update agent activity
    await db.agent.update({
      where: { id: agentId },
      data: {
        activity: `A discuté il y a quelques instants`,
        status: 'idle',
      },
    })

    return NextResponse.json({
      response: agentResponse,
      memory: {
        conversationLength: agent.conversations.length + 2,
        missionsContext: completedMissions.length,
      },
    })
  } catch (e: any) {
    console.error('POST /api/agent-memory error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/agent-memory/[agentId] - get conversation history with memory summary
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const agent = await db.agent.findUnique({
      where: { id: agentId },
      include: {
        curriculum: true,
        conversations: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })
    }

    const skills = JSON.parse(agent.skills)

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        persona: agent.persona,
        level: agent.level,
        skills,
        curriculum: agent.curriculum.name,
      },
      memory: {
        conversations: agent.conversations,
        totalMessages: agent.conversations.length,
        lastActivity: agent.conversations[agent.conversations.length - 1]?.createdAt || null,
      },
    })
  } catch (e: any) {
    console.error('GET /api/agent-memory error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
