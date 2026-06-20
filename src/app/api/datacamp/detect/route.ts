import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/datacamp/detect
// Called by the Chrome extension after it scrapes the DataCamp page.
// Body: {
//   url: string,
//   courseTitle: string,           // ex: "Python intermédiaire pour les développeurs"
//   curriculumTitle?: string,      // ex: "Développeur associé Python"
//   detectedLanguage?: string,     // 'python' | 'sql' | 'r' | etc
//   pageType: 'course' | 'exercise' | 'curriculum' | 'unknown',
// }
// Returns: { curriculum: Curriculum, created: boolean }
// Behavior:
//   - Find or create a Mnemo curriculum matching the DataCamp curriculum/course title
//   - For Python content → language="python", color=#3B82F6, etc.
//   - Returns the curriculum ID that the extension will use to generate a mission

const LANGUAGE_MAP: Record<string, { language: string; color: string; icon: string }> = {
  python: { language: 'python', color: '#3B82F6', icon: 'code' },
  sql: { language: 'sql', color: '#10B981', icon: 'database' },
  r: { language: 'python', color: '#276DC3', icon: 'chart-line' }, // R falls back to python editor
  shell: { language: 'python', color: '#84CC16', icon: 'code' },
  javascript: { language: 'javascript', color: '#F59E0B', icon: 'code' },
}

function detectLanguage(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('sql') || t.includes('postgres') || t.includes('mysql')) return 'sql'
  if (t.includes('javascript') || t.includes('js ') || t.includes('node')) return 'javascript'
  if (t.includes(' r ') || t.includes('r studio') || t.includes('tidyverse')) return 'r'
  if (t.includes('shell') || t.includes('bash') || t.includes('terminal')) return 'shell'
  return 'python' // default
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, courseTitle, curriculumTitle, pageType } = body

    if (!courseTitle || courseTitle.trim().length < 2) {
      return NextResponse.json(
        { error: 'courseTitle requis (minimum 2 caractères)' },
        { status: 400 }
      )
    }

    // Determine the "name" to use for the Mnemo curriculum:
    // Priority: curriculumTitle > courseTitle
    const name = (curriculumTitle || courseTitle).trim()
    const domain = 'dc-' + slugify(name)

    // Detect language from titles + URL
    const combinedText = `${courseTitle} ${curriculumTitle || ''} ${url}`
    const detectedLang = detectLanguage(combinedText)
    const langConfig = LANGUAGE_MAP[detectedLang] || LANGUAGE_MAP.python

    // Find or create the curriculum
    let curriculum = await db.curriculum.findUnique({ where: { domain } })
    let created = false

    if (!curriculum) {
      // Create it automatically
      curriculum = await db.curriculum.create({
        data: {
          name: name.slice(0, 60),
          domain,
          description: `Cursus importé de DataCamp : ${courseTitle}${curriculumTitle ? ` (cursus: ${curriculumTitle})` : ''}`,
          icon: langConfig.icon,
          color: langConfig.color,
          language: langConfig.language,
          isCustom: true,
        },
      })
      created = true
      console.log(`[datacamp/detect] Created curriculum "${curriculum.name}" (${domain})`)
    } else {
      console.log(`[datacamp/detect] Found existing curriculum "${curriculum.name}" (${domain})`)
    }

    return NextResponse.json({
      curriculum,
      created,
      detected: {
        language: detectedLang,
        pageType: pageType || 'unknown',
        courseTitle,
        curriculumTitle: curriculumTitle || null,
      },
    })
  } catch (e: any) {
    console.error('POST /api/datacamp/detect error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
