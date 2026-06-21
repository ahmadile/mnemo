import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateChatCompletion } from '@/lib/ai'

// POST /api/missions - generate a new mission from course content
// Body: { curriculumId: string, courseContent: string, courseLink?: string }
export async function POST(req: NextRequest) {
  try {
    const { curriculumId, courseContent, courseLink } = await req.json()

    if (!curriculumId || !courseContent || courseContent.trim().length < 10) {
      return NextResponse.json(
        { error: 'curriculumId et courseContent (min 10 caractères) sont requis' },
        { status: 400 }
      )
    }

    const curriculum = await db.curriculum.findUnique({ where: { id: curriculumId } })
    if (!curriculum) {
      return NextResponse.json({ error: 'Cursus introuvable' }, { status: 404 })
    }

    const languageMap: Record<string, string> = {
      python: 'Python',
      sql: 'SQL',
      'ai-engineering': 'Python',
      'data-science': 'Python',
      'web-dev': 'JavaScript',
    }
    const language = languageMap[curriculum.domain] || 'Python'

    const systemPrompt = `Tu es "Le Donneur de Mission", un agent mystérieux style GTA qui briefe les recrues.
Tu crées des missions de codage IMMERSIVES, narratives, qui ancrent les connaissances.
L'utilisateur vient de réviser un cours. Ta mission : créer un défi de codage SPECIFIQUE à ce qu'il vient d'apprendre,
pas un cours générique. La mission doit vraiment tester la notion exacte étudiée.

Tu DOIS répondre en JSON valide uniquement, avec cette structure exacte :
{
  "title": "Nom court et percutant de la mission (max 6 mots)",
  "briefing": "Briefing narratif style GTA, 2-4 phrases, qui pose le contexte. Pas de jargon scolaire. Ex: 'Un client vient d'appeler. Il lui faut un script qui... Tu as 5 minutes. Prouve que tu mérites ton pay.'",
  "objectives": ["objectif 1", "objectif 2", "objectif 3"],
  "starterCode": "code de départ dans un bloc commenté",
  "hint": "un indice utile si l'utilisateur bloque",
  "difficulty": "rookie | pro | elite"
}

Règles:
- Les objectifs doivent tester SPÉCIFIQUEMENT les notions du cours soumis
- Le code de départ doit être minimal (juste la structure)
- Pas de solution complète dans le starter code
- Réponds en français, format JSON strict, sans markdown autour`

    const userPrompt = `Cursus: ${curriculum.name} (${curriculum.domain})
Langage de code attendu: ${language}
${courseLink ? `Lien du cours: ${courseLink}` : ''}

Contenu du cours que l'utilisateur vient de réviser:
---
${courseContent}
---

Génère une mission de codage ${language} qui teste exactement les notions vues dans ce cours.`

    let rawResponse = await generateChatCompletion([
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { jsonMode: true })
    rawResponse = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let missionData
    try {
      missionData = JSON.parse(rawResponse)
    } catch (e) {
      console.error('Failed to parse LLM response:', rawResponse)
      return NextResponse.json(
        { error: 'Réponse IA invalide', raw: rawResponse },
        { status: 500 }
      )
    }

    const required = ['title', 'briefing', 'objectives', 'starterCode', 'hint', 'difficulty']
    for (const f of required) {
      if (!missionData[f]) {
        return NextResponse.json(
          { error: `Champ manquant: ${f}`, raw: rawResponse },
          { status: 500 }
        )
      }
    }

    const mission = await db.mission.create({
      data: {
        curriculumId,
        title: missionData.title,
        briefing: missionData.briefing,
        objectives: JSON.stringify(missionData.objectives),
        starterCode: missionData.starterCode,
        hint: missionData.hint,
        difficulty: missionData.difficulty,
        language,
        sourceContent: courseContent,
        xp: missionData.difficulty === 'elite' ? 300 : missionData.difficulty === 'pro' ? 200 : 100,
      },
    })

    return NextResponse.json({ mission })
  } catch (e: any) {
    console.error('POST /api/missions error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/missions?curriculumId=... - list missions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const curriculumId = searchParams.get('curriculumId')

    const missions = await db.mission.findMany({
      where: curriculumId ? { curriculumId } : undefined,
      include: {
        curriculum: { select: { name: true, color: true, domain: true } },
        submissions: { select: { id: true, passed: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ missions })
  } catch (e: any) {
    console.error('GET /api/missions error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
