import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/activity
// Returns daily activity data for the heatmap + streak count
// Aggregates: missions completed, missions generated, agents born, daily quests completed
export async function GET() {
  try {
    // Get all events from the last 365 days
    const oneYearAgo = new Date()
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)

    // Fetch missions created
    const missions = await db.mission.findMany({
      where: { createdAt: { gte: oneYearAgo } },
      select: { createdAt: true, status: true },
    })

    // Fetch mission submissions (completed)
    const submissions = await db.missionSubmission.findMany({
      where: { createdAt: { gte: oneYearAgo }, passed: true },
      select: { createdAt: true },
    })

    // Fetch agents born
    const agents = await db.agent.findMany({
      where: { createdAt: { gte: oneYearAgo } },
      select: { createdAt: true },
    })

    // Fetch daily quests completed
    const quests = await db.dailyQuest.findMany({
      where: { completedAt: { gte: oneYearAgo } },
      select: { completedAt: true },
    })

    // Aggregate by day
    const dayMap: Record<string, number> = {}
    const addEvent = (date: Date) => {
      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
      const key = d.toISOString().slice(0, 10)
      dayMap[key] = (dayMap[key] || 0) + 1
    }

    missions.forEach((m) => addEvent(m.createdAt))
    submissions.forEach((s) => addEvent(s.createdAt))
    agents.forEach((a) => addEvent(a.createdAt))
    quests.forEach((q) => addEvent(q.completedAt!))

    // Build activity data array
    const today = new Date()
    const data: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = dayMap[dateStr] || 0
      let level: 0 | 1 | 2 | 3 | 4 = 0
      if (count >= 1) level = 1
      if (count >= 3) level = 2
      if (count >= 5) level = 3
      if (count >= 8) level = 4
      data.push({ date: dateStr, count, level })
    }

    // Compute streak: consecutive days with at least 1 event, ending today or yesterday
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = dayMap[dateStr] || 0
      if (count > 0) {
        streak++
      } else {
        // Allow today to be empty (user hasn't done anything today yet) - continue streak from yesterday
        if (i === 0) continue
        break
      }
    }

    return NextResponse.json({
      data,
      streak,
      totals: {
        missions: missions.length,
        submissions: submissions.length,
        agents: agents.length,
        quests: quests.length,
      },
    })
  } catch (e: any) {
    console.error('GET /api/activity error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
