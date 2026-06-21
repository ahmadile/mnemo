import { NextRequest, NextResponse } from 'next/server'
import { getAIConfig, saveAIConfig, AIConfig } from '@/lib/ai'

export async function GET() {
  try {
    const config = await getAIConfig()
    return NextResponse.json({ config })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, baseUrl, model } = await req.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Le provider et la clé API sont requis' },
        { status: 400 }
      )
    }

    const newConfig: AIConfig = {
      provider,
      apiKey,
      baseUrl: baseUrl || 'https://internal-api.z.ai/v1',
      model: model || 'glm-4.6',
    }

    await saveAIConfig(newConfig)
    return NextResponse.json({ message: 'Configuration sauvegardée avec succès', config: newConfig })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
