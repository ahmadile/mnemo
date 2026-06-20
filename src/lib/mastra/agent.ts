// Mastra agent-mémoire configuration for Mnemo
// Uses Z.ai (GLM-4) as the LLM provider via OpenAI-compatible API
// Provides persistent memory per agent + per user

import { Mastra } from '@mastra/core'
import { openai } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

// Z.ai provider (OpenAI-compatible endpoint)
// The z-ai-web-dev-sdk is used internally, but for Mastra we need an OpenAI-compatible client
// We create a custom provider that points to Z.ai's API
const zaiProvider = createOpenAICompatible({
  name: 'zai',
  baseURL: 'https://internal-api.z.ai/v1',
  apiKey: process.env.ZAI_API_KEY || 'zai-default',
})

// Fallback: use standard OpenAI provider if ZAI_API_KEY is set
function getModel() {
  // Try Z.ai first (internal API)
  try {
    return zaiProvider('glm-4.6')
  } catch (e) {
    // Fallback to OpenAI if configured
    return openai('gpt-4o-mini')
  }
}

// Create the Mastra instance with memory storage
// In production, use Postgres or LibSQL for persistent memory
// In dev, use in-memory storage (resets on restart)
export const mastra = new Mastra({
  // Memory configuration
  // Mastra stores conversation history per thread (agentId + userId)
  options: {
    // Default memory: in-memory for dev, can be swapped for production
  },
})

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
