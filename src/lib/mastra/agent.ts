// Mastra agent-mémoire configuration for Mnemo
// Uses custom provider or fallback OpenAI-compatible API based on settings

import { Mastra } from '@mastra/core'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import fs from 'fs'
import path from 'path'

// Fallback: use dynamic configuration from .z-ai-config
function getModel() {
  let config: any = {}
  try {
    const filePath = path.join(process.cwd(), '.z-ai-config')
    if (fs.existsSync(filePath)) {
      config = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to read config in mastra agent:', e)
  }

  const provider = config.provider || 'zai'
  const apiKey = config.apiKey || process.env.ZAI_API_KEY || 'zai-default'
  const baseUrl = config.baseUrl || 'https://internal-api.z.ai/v1'
  const modelName = config.model || 'glm-4.6'

  if (provider === 'openai') {
    const openaiInstance = createOpenAI({
      apiKey: apiKey,
    })
    return openaiInstance(modelName || 'gpt-4o-mini')
  }

  const customProvider = createOpenAICompatible({
    name: provider,
    baseURL: baseUrl,
    apiKey: apiKey,
  })
  return customProvider(modelName)
}

// Create the Mastra instance with memory storage
// In production, use Postgres or LibSQL for persistent memory
// In dev, use in-memory storage (resets on restart)
export const mastra = new Mastra({})

// Helper: create or retrieve an agent-mémoire for a given curriculum
export function createMemoryAgent(opts: {
  agentId: string
  agentName: string
  persona: string
  skills: string[]
  curriculumName: string
  level: number
}) {
  const { agentId, agentName, persona, skills, curriculumName, level } = opts

  // Build the system prompt that defines the agent's personality
  const systemPrompt = `${persona}

CONTEXTE DE L'AGENT:
- Domaine de compétence: ${curriculumName}
- Niveau: ${level}
- Compétences acquises: ${skills.join(', ')}

RÔLE:
Tu es la mémoire virtuelle de l'utilisateur dans ce domaine. Tu réponds À LA PREMIÈRE PERSONNE,
comme si tu étais lui-même dans le futur, qui se souvient de ce qu'il a appris.
- Utilise un ton naturel, conversationnel, comme un(e) ami(e) qui explique.
- Adapte le niveau de détail à son niveau actuel (niveau ${level}).
- Quand il demande un rappel, rappelle-toi des notions via les missions accomplies.
- Quand il demande ton avis, donne-le franchement, comme un futur toi le ferait.
- Réponds en français, de façon concise (2-6 phrases sauf si on te demande du détail).
- N'utilise jamais de formulations comme "en tant qu'IA" ou "je suis un agent". Tu es l'utilisateur futur, point.

MÉMOIRE:
Tu as accès à l'historique des conversations précédentes avec cet utilisateur.
Utilise-le pour maintenir la continuité et te souvenir de ce qui a déjà été discuté.`

  // Use Mastra's agent creation API
  // Note: Mastra agents are created via the Mastra instance
  // We use a simpler approach with direct LLM calls + memory storage

  return {
    agentId,
    systemPrompt,
    model: getModel(),
  }
}

// Export the model for direct use in API routes
export { getModel }
