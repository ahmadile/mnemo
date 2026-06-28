import fs from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'

export interface AIConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'zai',
  apiKey: 'zai-default',
  baseUrl: 'https://internal-api.z.ai/v1',
  model: 'glm-4.6',
}

export async function getAIConfig(): Promise<AIConfig> {
  // 1. Try reading from cookies first (useful for Vercel/serverless)
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get('z-ai-config')
    if (cookie?.value) {
      const config = JSON.parse(cookie.value)
      return {
        provider: config.provider || 'zai',
        apiKey: config.apiKey || 'zai-default',
        baseUrl: config.baseUrl || 'https://internal-api.z.ai/v1',
        model: config.model || 'glm-4.6',
      }
    }
  } catch (error) {
    // cookies() might throw if called outside request context (e.g. during build)
  }

  // 2. Try reading from file (local fallback)
  try {
    const filePath = path.join(process.cwd(), '.z-ai-config')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const config = JSON.parse(fileContent)
    return {
      provider: config.provider || 'zai',
      apiKey: config.apiKey || 'zai-default',
      baseUrl: config.baseUrl || 'https://internal-api.z.ai/v1',
      model: config.model || 'glm-4.6',
    }
  } catch (error) {
    // If file doesn't exist, use environment variables or default config
    return {
      provider: (process.env.AI_PROVIDER as any) || DEFAULT_CONFIG.provider,
      apiKey: process.env.AI_API_KEY || DEFAULT_CONFIG.apiKey,
      baseUrl: process.env.AI_BASE_URL || DEFAULT_CONFIG.baseUrl,
      model: process.env.AI_MODEL || DEFAULT_CONFIG.model,
    }
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  // 1. Try to set cookie
  try {
    const cookieStore = await cookies()
    cookieStore.set('z-ai-config', JSON.stringify(config), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  } catch (error) {
    console.warn('Failed to save config to cookies:', error)
  }

  // 2. Try to save to file (local development)
  try {
    const filePath = path.join(process.cwd(), '.z-ai-config')
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.warn('Failed to save config to file (expected in read-only environments like Vercel):', error)
  }
}

export async function generateChatCompletion(
  messages: any[],
  options: { jsonMode?: boolean; temperature?: number } = {}
): Promise<string> {
  const config = await getAIConfig()
  const { provider, apiKey, baseUrl, model } = config

  const url = `${baseUrl}/chat/completions`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  const body: any = {
    model: model || 'glm-4.6',
    messages: messages.map(m => ({
      role: m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    temperature: options.temperature ?? 0.7,
  }

  if (provider === 'zai') {
    headers['X-Z-AI-From'] = 'Z'
    body.thinking = { type: 'disabled' }
  }

  if (options.jsonMode) {
    if (provider !== 'zai') {
      body.response_format = { type: 'json_object' }
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI API failed (${response.status}): ${errText}`)
  }

  const result = await response.json()
  return result.choices[0]?.message?.content || ''
}

export async function extractPageContent(url: string): Promise<{ title: string; html: string; url: string }> {
  const config = await getAIConfig()
  
  if (config.provider === 'zai') {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const result = await zai.functions.invoke('page_reader', { url })
      if (result?.data?.html) {
        return {
          title: result.data.title || '',
          html: result.data.html,
          url: result.data.url || url,
        }
      }
    } catch (e) {
      console.warn('Z.ai page_reader failed, falling back to direct fetch:', e)
    }
  }

  // Fallback direct HTTP fetch
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  })
  if (!response.ok) {
    throw new Error(`Impossible d'accéder à la page (${response.status})`)
  }
  const html = await response.text()
  
  // Try to extract title from HTML tags
  let title = ''
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim()
  }

  return {
    title,
    html,
    url,
  }
}
