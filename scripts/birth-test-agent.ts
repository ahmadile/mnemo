// Dev helper: bump Python curriculum XP to 1500 + mark a mission completed + birth an agent
// This is just for end-to-end testing of the agent chat feature.
import { db } from '../src/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

async function main() {
  // Find Python curriculum by name (domain slug may vary)
  const all = await db.curriculum.findMany()
  const py = all.find((c) => c.name.toLowerCase().includes('python'))
  if (!py) throw new Error('Python curriculum not found')
  await db.curriculum.update({
    where: { id: py.id },
    data: { xp: 1500, level: 3 },
  })
  console.log(`Bumped ${py.name} to level 3 (1500 XP)`)

  // Check if agent already exists
  const existingAgent = await db.agent.findUnique({ where: { curriculumId: py.id } })
  if (existingAgent) {
    console.log(`Agent already exists: ${existingAgent.name}`)
    return
  }

  // Generate agent persona via LLM
  const completedMissions = await db.mission.findMany({
    where: { curriculumId: py.id, status: 'completed' },
  })
  const titles = completedMissions.map((m) => m.title)

  const systemPrompt = `Tu es le système de génération d'agents virtuels de Cerebro.
L'utilisateur vient d'atteindre le niveau 3 dans un cursus. Un nouvel agent doit "naître" dans son monde virtuel.
Cet agent représente la version future de l'utilisateur dans ce domaine: sa mémoire, ses compétences.

Réponds en JSON valide uniquement:
{
  "name": "Un nom de code court et stylé pour l'agent (ex: PY-7, SQL-Oracle, Dr.Data)",
  "persona": "Description 2-3 phrases du caractère de l'agent, son style de réponse. Doit parler À LA PREMIÈRE PERSONNE comme si c'était l'utilisateur futur qui se souvient de ses apprentissages.",
  "skills": ["compétence 1", "compétence 2", "compétence 3"]
}`

  const userPrompt = `Cursus: ${py.name}
Niveau atteint: 3
XP totale: 1500
Missions terminées: ${titles.join(', ') || 'plusieurs missions sur les variables, types, fonctions'}

Génère le profil de l'agent qui va représenter l'utilisateur dans ce domaine.`

  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  let raw = completion.choices[0]?.message?.content || ''
  raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const data = JSON.parse(raw)

  const agent = await db.agent.create({
    data: {
      curriculumId: py.id,
      name: data.name,
      persona: data.persona,
      skills: JSON.stringify(data.skills || []),
      totalXp: 1500,
      level: 3,
      status: 'idle',
      activity: 'Vient de naître. En attente de votre premier échange.',
    },
  })

  console.log(`Agent birthed: ${agent.name}`)
  console.log(`Persona: ${agent.persona}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
