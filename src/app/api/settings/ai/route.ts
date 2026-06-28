import { NextRequest, NextResponse } from 'next/server'
import { getAIConfig, saveAIConfig, testAIConfig, AIConfig } from '@/lib/ai'

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

    // Normalize Base URL: strip trailing slash and '/chat/completions' suffix
    let normalizedBaseUrl = baseUrl ? baseUrl.trim() : ''
    if (normalizedBaseUrl.endsWith('/chat/completions')) {
      normalizedBaseUrl = normalizedBaseUrl.slice(0, -'/chat/completions'.length)
    } else if (normalizedBaseUrl.endsWith('/chat/completions/')) {
      normalizedBaseUrl = normalizedBaseUrl.slice(0, -'/chat/completions/'.length)
    }
    if (normalizedBaseUrl.endsWith('/')) {
      normalizedBaseUrl = normalizedBaseUrl.slice(0, -1)
    }

    const testConfig: AIConfig = {
      provider,
      apiKey,
      baseUrl: normalizedBaseUrl || 'https://internal-api.z.ai/v1',
      model: model || 'glm-4.6',
    }

    // Perform connection verification
    const testResult = await testAIConfig(testConfig)

    const newConfig: AIConfig = {
      ...testConfig,
      isValid: testResult.success,
      validationError: testResult.success ? undefined : testResult.error,
    }

    await saveAIConfig(newConfig)
    return NextResponse.json({ 
      message: testResult.success 
        ? 'Configuration validée et sauvegardée avec succès' 
        : 'Configuration sauvegardée, mais le test de connexion a échoué', 
      config: newConfig 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
