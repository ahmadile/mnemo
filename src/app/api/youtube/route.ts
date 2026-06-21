import { NextRequest, NextResponse } from 'next/server'
import { extractPageContent } from '@/lib/ai'

// POST /api/youtube
// Body: { url: string }
// Extracts transcript from a YouTube video and returns the text.
// We use a public transcript API approach via page_reader on the video URL.
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'URL YouTube invalide. Elle doit contenir youtube.com ou youtu.be' },
        { status: 400 }
      )
    }

    // Extract video ID
    let videoId = ''
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || ''
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split(/[&#]/)[0] || ''
    } else if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1]?.split(/[?#]/)[0] || ''
    }

    if (!videoId) {
      return NextResponse.json({ error: 'ID vidéo introuvable dans l\'URL' }, { status: 400 })
    }

    // Try multiple transcript sources
    const sources = [
      `https://www.youtube.com/watch?v=${videoId}`,
      `https://youtubetotranscript.com/transcript?v=${videoId}`,
    ]

    let transcriptText = ''
    let videoTitle = ''

    for (const sourceUrl of sources) {
      try {
        const result = await extractPageContent(sourceUrl)
        if (result?.html) {
          const text = result.html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim()
          if (text.length > 200) {
            transcriptText = text
            videoTitle = result.title || ''
            break
          }
        }
      } catch (e) {
        // Try next source
        continue
      }
    }

    if (!transcriptText) {
      return NextResponse.json(
        {
          error: 'Transcription indisponible pour cette vidéo. La vidéo doit avoir des sous-titres activés. Alternative: copiez-collez manuellement le contenu.',
          videoId,
          url,
        },
        { status: 422 }
      )
    }

    // Truncate to ~6000 chars for LLM context
    const truncated = transcriptText.slice(0, 8000)

    return NextResponse.json({
      title: videoTitle,
      videoId,
      url,
      transcript: truncated,
      length: transcriptText.length,
      truncated: transcriptText.length > 8000,
    })
  } catch (e: any) {
    console.error('POST /api/youtube error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
