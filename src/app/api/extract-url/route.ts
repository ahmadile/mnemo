import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/extract-url
// Body: { url: string }
// Uses z-ai-web-dev-sdk page_reader function to extract content from a URL
// (DataCamp, blog post, doc page, etc.)
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'URL invalide. Elle doit commencer par http:// ou https://' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const result = await zai.functions.invoke('page_reader', { url })

    if (!result?.data?.html) {
      return NextResponse.json(
        { error: 'Impossible de lire le contenu de cette page. Vérifiez que l\'URL est accessible.' },
        { status: 422 }
      )
    }

    // Strip HTML tags to get clean text
    const text = result.data.html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return NextResponse.json({
      title: result.data.title || '',
      url: result.data.url || url,
      content: text,
      publishedTime: result.data.publishedTime || null,
      contentLength: text.length,
    })
  } catch (e: any) {
    console.error('POST /api/extract-url error:', e)
    return NextResponse.json(
      { error: e.message || 'Erreur lors de l\'extraction du contenu' },
      { status: 500 }
    )
  }
}
