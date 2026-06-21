import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/smart-import
// Body: { url: string }
// Auto-detects the type of URL and extracts content using the right method:
// - DataCamp → page_reader (may be blocked, user can paste manually)
// - YouTube → transcript extraction
// - GitHub → README extraction
// - Blog/Doc/Article → page_reader
// - Any other URL → page_reader (fallback)
//
// Returns: {
//   type: 'datacamp' | 'youtube' | 'github' | 'article' | 'unknown',
//   title: string,
//   content: string,
//   url: string,
//   length: number,
//   warning?: string,
// }

type ContentType = 'datacamp' | 'youtube' | 'github' | 'article' | 'unknown'

function detectType(url: string): ContentType {
  const lower = url.toLowerCase()
  if (lower.includes('datacamp.com')) return 'datacamp'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('github.com') || lower.includes('raw.githubusercontent.com')) return 'github'
  if (lower.includes('medium.com') || lower.includes('dev.to') || lower.includes('blog') ||
      lower.includes('docs.') || lower.includes('documentation') || lower.includes('tutorial') ||
      lower.includes('wikipedia.org') || lower.includes('mdn') || lower.includes('w3schools')) return 'article'
  return 'unknown'
}

function extractYouTubeId(url: string): string | null {
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split(/[?#]/)[0] || null
  }
  if (url.includes('v=')) {
    return url.split('v=')[1]?.split(/[&#]/)[0] || null
  }
  if (url.includes('/embed/')) {
    return url.split('/embed/')[1]?.split(/[?#]/)[0] || null
  }
  return null
}

function cleanHtml(html: string): string {
  return html
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
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'URL invalide. Elle doit commencer par http:// ou https://' },
        { status: 400 }
      )
    }

    const type = detectType(url)
    let title = ''
    let content = ''
    let warning: string | undefined

    const zai = await ZAI.create()

    if (type === 'youtube') {
      // YouTube: try to get transcript
      const videoId = extractYouTubeId(url)
      if (!videoId) {
        return NextResponse.json({ error: 'ID vidéo YouTube introuvable' }, { status: 400 })
      }

      const sources = [
        `https://www.youtube.com/watch?v=${videoId}`,
        `https://youtubetotranscript.com/transcript?v=${videoId}`,
      ]

      for (const sourceUrl of sources) {
        try {
          const result = await zai.functions.invoke('page_reader', { url: sourceUrl })
          if (result?.data?.html) {
            const text = cleanHtml(result.data.html)
            if (text.length > 200) {
              content = text.slice(0, 8000)
              title = result.data.title || `YouTube: ${videoId}`
              break
            }
          }
        } catch { continue }
      }

      if (!content) {
        warning = "Transcription YouTube indisponible (CAPTCHA ou sous-titres désactivés). Collez le contenu manuellement."
        title = `YouTube: ${videoId}`
      }
    } else if (type === 'github') {
      // GitHub: try raw README
      const readmeUrl = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/')

      try {
        const result = await zai.functions.invoke('page_reader', { url: readmeUrl })
        if (result?.data?.html) {
          content = cleanHtml(result.data.html).slice(0, 8000)
          title = result.data.title || url.split('/').slice(-2).join('/')
        }
      } catch {
        // Fallback: try the original URL
        try {
          const result = await zai.functions.invoke('page_reader', { url })
          if (result?.data?.html) {
            content = cleanHtml(result.data.html).slice(0, 8000)
            title = result.data.title || 'GitHub'
          }
        } catch { /* continue */ }
      }

      if (!content) {
        warning = "Impossible de lire ce dépôt GitHub. Essayez le lien raw du README."
      }
    } else {
      // DataCamp, article, unknown → page_reader
      try {
        const result = await zai.functions.invoke('page_reader', { url })
        if (result?.data?.html) {
          const text = cleanHtml(result.data.html)
          if (text.length > 50) {
            content = text.slice(0, 8000)
            title = result.data.title || url
          } else {
            warning = "Le contenu extrait est très court. La page nécessite peut-être une authentification (DataCamp) ou JavaScript."
          }
        } else {
          warning = "Aucun contenu trouvé sur cette page."
        }
      } catch (e: any) {
        warning = `Erreur d'extraction: ${e.message}. Collez le contenu manuellement.`
      }

      // DataCamp specific warning
      if (type === 'datacamp' && content.length < 500) {
        warning = "DataCamp nécessite une connexion. Utilisez l'extension Chrome Mnemo ou collez le contenu manuellement."
      }
    }

    return NextResponse.json({
      type,
      title: title || url,
      content,
      url,
      length: content.length,
      warning,
    })
  } catch (e: any) {
    console.error('POST /api/smart-import error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
