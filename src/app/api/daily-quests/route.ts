import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/daily-quests
// Returns today's quests. Auto-creates them if they don't exist yet for today.
export async function GET() {
  try {
    // Get today's date at midnight (UTC)
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    // Check if today's quests already exist
    let quests = await db.dailyQuest.findMany({
      where: { questDate: today },
      orderBy: { createdAt: 'asc' },
    })

    // If no quests for today, generate them
    if (quests.length === 0) {
      quests = await generateDailyQuests(today)
    }

    return NextResponse.json({ quests, date: today.toISOString() })
  } catch (e: any) {
    console.error('GET /api/daily-quests error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/daily-quests
// Body: { questId: string, action: 'complete' }
// Marks a quest as completed
export async function POST(req: NextRequest) {
  try {
    const { questId, action } = await req.json()

    if (action !== 'complete' || !questId) {
      return NextResponse.json({ error: 'action ou questId manquant' }, { status: 400 })
    }

    const quest = await db.dailyQuest.findUnique({ where: { id: questId } })
    if (!quest) {
      return NextResponse.json({ error: 'Quête introuvable' }, { status: 404 })
    }

    if (quest.status === 'completed') {
      return NextResponse.json({ quest, alreadyCompleted: true })
    }

    const updated = await db.dailyQuest.update({
      where: { id: questId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // Award XP to the linked curriculum if applicable
    if (quest.missionId) {
      const mission = await db.mission.findUnique({
        where: { id: quest.missionId },
        select: { curriculumId: true },
      })
      if (mission) {
        await db.curriculum.update({
          where: { id: mission.curriculumId },
          data: { xp: { increment: quest.xpReward } },
        })
      }
    }

    return NextResponse.json({ quest: updated })
  } catch (e: any) {
    console.error('POST /api/daily-quests error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Generate today's quests based on user's data
async function generateDailyQuests(today: Date) {
  // Fetch user's data to personalize quests
  const curricula = await db.curriculum.findMany({
    include: {
      missions: {
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      agent: { select: { id: true, name: true } },
    },
  })

  const allCompletedMissions = curricula.flatMap((c) =>
    c.missions.map((m) => ({ ...m, curriculumName: c.name, curriculumColor: c.color, curriculumId: c.id }))
  )

  const agents = curricula.filter((c) => c.agent).map((c) => c.agent!)

  const questsToCreate: {
    title: string
    description: string
    type: string
    xpReward: number
    status: string
    missionId?: string
    agentId?: string
    questDate: Date
  }[] = []

  // Quest 1: Review an old mission (spaced retrieval)
  if (allCompletedMissions.length > 0) {
    const randomMission = allCompletedMissions[Math.floor(Math.random() * allCompletedMissions.length)]
    questsToCreate.push({
      title: `Réviser : ${randomMission.title}`,
      description: `Refaire la mission "${randomMission.title}" du cursus ${randomMission.curriculumName} pour ancrer la notion.`,
      type: 'review',
      xpReward: 75,
      status: 'pending',
      missionId: randomMission.id,
      questDate: today,
    })
  }

  // Quest 2: Chat with an agent (memory recall)
  if (agents.length > 0) {
    const randomAgent = agents[Math.floor(Math.random() * agents.length)]
    questsToCreate.push({
      title: `Discuter avec ${randomAgent.name}`,
      description: `Posez une question à votre agent-mémoire ${randomAgent.name} pour vérifier ce que vous avez retenu.`,
      type: 'review',
      xpReward: 50,
      status: 'pending',
      agentId: randomAgent.id,
      questDate: today,
    })
  }

  // Quest 3: Submit a new course (if user has curricula without recent missions)
  const curriculaWithoutRecentMissions = curricula.filter(
    (c) => c.missions.length === 0
  )
  if (curriculaWithoutRecentMissions.length > 0) {
    const target = curriculaWithoutRecentMissions[0]
    questsToCreate.push({
      title: `Soumettre un cours dans ${target.name}`,
      description: `Capturez un nouveau cours DataCamp ou collez vos notes pour générer une mission dans le cursus ${target.name}.`,
      type: 'new_mission',
      xpReward: 100,
      status: 'pending',
      questDate: today,
    })
  }

  // Quest 4: Streak / daily engagement (always present)
  questsToCreate.push({
    title: 'Quête du jour',
    description: 'Complétez au moins une mission ou une conversation avec un agent aujourd\'hui.',
    type: 'streak',
    xpReward: 50,
    status: 'pending',
    questDate: today,
  })

  // If no quests at all (empty database), add a welcome quest
  if (questsToCreate.length === 0) {
    questsToCreate.push({
      title: 'Bienvenue dans Mnemo',
      description: 'Créez votre premier cursus ou installez l\'extension DataCamp pour commencer votre apprentissage.',
      type: 'new_mission',
      xpReward: 50,
      status: 'pending',
      questDate: today,
    })
  }

  // Create all quests
  await db.dailyQuest.createMany({
    data: questsToCreate,
  })

  // Fetch them back
  return db.dailyQuest.findMany({
    where: { questDate: today },
    orderBy: { createdAt: 'asc' },
  })
}
