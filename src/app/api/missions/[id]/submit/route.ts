import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/missions/[id]/submit
// Body: { code: string }
// Uses LLM to validate the code against the mission objectives.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { code } = await req.json()

    if (!code || code.trim().length < 5) {
      return NextResponse.json(
        { error: 'Le code soumis est trop court' },
        { status: 400 }
      )
    }

    const mission = await db.mission.findUnique({
      where: { id },
      include: { curriculum: true },
    })
    if (!mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    }

    const objectives = JSON.parse(mission.objectives)

    const systemPrompt = `Tu es "L'Évaluateur", un agent IA qui jauge les missions de codage.
L'utilisateur vient de soumettre du code pour une mission. Tu dois:
1. Vérifier si le code répond à TOUS les objectifs de la mission
2. Identifier ce qui fonctionne et ce qui manque
3. Donner un verdict clair

Réponds en JSON valide uniquement:
{
  "passed": true | false,
  "feedback": "Feedback en 2-4 phrases, style recruteur bienveillant mais direct. Si failed, indique clairement ce qui manque. Si passed, valide et donne un conseil pour aller plus loin.",
  "score": 0-100
}

Règles:
- Sois strict mais juste: si un objectif n'est pas atteint, passed = false
- Le code peut être syntaxiquement imparfait mais fonctionnellement correct
- Ne demande jamais un code parfait, demande un code qui RÉPOND aux objectifs
- Réponds en français, JSON strict`

    const userPrompt = `Mission: ${mission.title}
Briefing: ${mission.briefing}
Langage: ${mission.language}
Objectifs à valider:
${objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}

Code soumis par l'utilisateur:
\`\`\`${mission.language}
${code}
\`\`\`

Évalue ce code. Le verdict doit refléter si TOUS les objectifs sont atteints.`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    let rawResponse = completion.choices[0]?.message?.content || ''
    rawResponse = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let evaluation
    try {
      evaluation = JSON.parse(rawResponse)
    } catch (e) {
      console.error('Failed to parse evaluation:', rawResponse)
      evaluation = {
        passed: true,
        feedback: 'Mission validée. Continue comme ça, recrue.',
        score: 75,
      }
    }

    const submission = await db.missionSubmission.create({
      data: {
        missionId: id,
        code,
        feedback: evaluation.feedback || '',
        passed: evaluation.passed ?? false,
      },
    })

    if (evaluation.passed && mission.status !== 'completed') {
      await db.mission.update({
        where: { id },
        data: { status: 'completed' },
      })

      const updatedCurriculum = await db.curriculum.update({
        where: { id: mission.curriculumId },
        data: { xp: { increment: mission.xp } },
        include: { missions: true, agent: true },
      })

      const newLevel = Math.max(1, Math.floor(updatedCurriculum.xp / 500) + 1)
      await db.curriculum.update({
        where: { id: mission.curriculumId },
        data: { level: newLevel },
      })

      // Birth agent at level 3 if not exists, or update existing
      if (newLevel >= 3 && !updatedCurriculum.agent) {
        await birthAgent(mission.curriculumId)
      } else if (updatedCurriculum.agent) {
        await db.agent.update({
          where: { id: updatedCurriculum.agent.id },
          data: {
            totalXp: updatedCurriculum.xp,
            level: newLevel,
            activity: `A complété une nouvelle mission: "${mission.title}".`,
          },
        })
      }

      return NextResponse.json({
        submission,
        evaluation,
        missionCompleted: true,
        newXp: updatedCurriculum.xp,
        newLevel,
      })
    }

    return NextResponse.json({ submission, evaluation, missionCompleted: false })
  } catch (e: any) {
    console.error('POST /api/missions/[id]/submit error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Birth a new agent for a curriculum
async function birthAgent(curriculumId: string) {
  const curriculum = await db.curriculum.findUnique({
    where: { id: curriculumId },
    include: { missions: { where: { status: 'completed' } } },
  })
  if (!curriculum) return

  const completedTitles = curriculum.missions.map((m) => m.title)

  const systemPrompt = `Tu es le système de génération d'agents virtuels de Cerebro.
L'utilisateur vient d'atteindre le niveau 3 dans un cursus. Un nouvel agent doit "naître" dans son monde virtuel.
Cet agent représente la version future de l'utilisateur dans ce domaine: sa mémoire, ses compétences.

Réponds en JSON valide uniquement:
{
  "name": "Un nom de code court et stylé pour l'agent (ex: PY-7, SQL-Oracle, Dr.Data)",
  "persona": "Description 2-3 phrases du caractère de l'agent, son style de réponse. Doit parler À LA PREMIÈRE PERSONNE comme si c'était l'utilisateur futur qui se souvient de ses apprentissages.",
  "skills": ["compétence 1", "compétence 2", "compétence 3"]
}

Le persona doit refléter: 'Je suis toi, dans le futur, qui a déjà maîtrisé [cursus]. Je réponds comme toi, avec ton niveau, mais avec le recul de quelqu'un qui a déjà parcouru le chemin.'`

  const userPrompt = `Cursus: ${curriculum.name}
Niveau atteint: ${curriculum.level}
XP totale: ${curriculum.xp}
Missions terminées: ${completedTitles.join(', ') || 'Aucune'}

Génère le profil de l'agent qui va représenter l'utilisateur dans ce domaine.`

  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    let rawResponse = completion.choices[0]?.message?.content || ''
    rawResponse = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    const agentData = JSON.parse(rawResponse)

    await db.agent.create({
      data: {
        curriculumId,
        name: agentData.name,
        persona: agentData.persona,
        skills: JSON.stringify(agentData.skills || []),
        totalXp: curriculum.xp,
        level: curriculum.level,
        status: 'idle',
        activity: 'Vient de naître. En attente de votre premier échange.',
      },
    })
    console.log(`Agent birthed for curriculum ${curriculum.name}: ${agentData.name}`)
  } catch (e) {
    console.error('birthAgent error:', e)
  }
}
