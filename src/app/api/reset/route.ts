import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/reset
// Wipes ALL data (curricula, missions, agents, conversations, daily quests)
// Used by the Settings view
export async function POST() {
  try {
    console.log('RESET: deleting all data...')

    const deletedQuests = await db.dailyQuest.deleteMany({})
    const deletedConvos = await db.agentConversation.deleteMany({})
    const deletedSubs = await db.missionSubmission.deleteMany({})
    const deletedMissions = await db.mission.deleteMany({})
    const deletedAgents = await db.agent.deleteMany({})
    const deletedCurricula = await db.curriculum.deleteMany({})

    console.log(`RESET done: ${deletedCurricula.count} cursus, ${deletedMissions.count} missions, ${deletedAgents.count} agents`)

    return NextResponse.json({
      success: true,
      deleted: {
        curricula: deletedCurricula.count,
        missions: deletedMissions.count,
        submissions: deletedSubs.count,
        agents: deletedAgents.count,
        conversations: deletedConvos.count,
        dailyQuests: deletedQuests.count,
      },
    })
  } catch (e: any) {
    console.error('POST /api/reset error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
