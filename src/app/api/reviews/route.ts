import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scheduleReview, isDueForReview } from '@/lib/spaced-repetition'

// GET /api/reviews
// Returns missions that are due for review (spaced repetition)
export async function GET() {
  try {
    const now = new Date()

    // Find all completed missions with their review state
    const missions = await db.mission.findMany({
      where: {
        status: 'completed',
        // Due for review: nextReviewAt is in the past OR null (never reviewed)
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null },
        ],
      },
      include: {
        curriculum: { select: { name: true, color: true, domain: true } },
      },
      orderBy: { nextReviewAt: 'asc' },
    })

    const dueMissions = missions.map((m) => ({
      id: m.id,
      title: m.title,
      briefing: m.briefing,
      difficulty: m.difficulty,
      xp: m.xp,
      language: m.language,
      reviewCount: m.reviewCount,
      lastReviewAt: m.lastReviewAt,
      nextReviewAt: m.nextReviewAt,
      curriculum: m.curriculum,
      objectives: JSON.parse(m.objectives),
    }))

    // Also get upcoming reviews (next 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const upcoming = await db.mission.findMany({
      where: {
        status: 'completed',
        nextReviewAt: {
          gt: now,
          lte: sevenDaysFromNow,
        },
      },
      select: {
        id: true,
        title: true,
        nextReviewAt: true,
        curriculum: { select: { name: true, color: true } },
      },
      orderBy: { nextReviewAt: 'asc' },
    })

    return NextResponse.json({
      due: dueMissions,
      upcoming,
      stats: {
        dueCount: dueMissions.length,
        upcomingCount: upcoming.length,
        totalReviewed: missions.filter((m) => m.reviewCount > 0).length,
      },
    })
  } catch (e: any) {
    console.error('GET /api/reviews error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/reviews
// Body: { missionId: string, rating: 'again' | 'hard' | 'good' | 'easy' }
// Schedules the next review using FSRS algorithm
export async function POST(req: NextRequest) {
  try {
    const { missionId, rating } = await req.json()

    if (!missionId || !rating) {
      return NextResponse.json({ error: 'missionId et rating requis' }, { status: 400 })
    }

    const mission = await db.mission.findUnique({
      where: { id: missionId },
    })

    if (!mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    }

    // Schedule next review using FSRS
    const result = scheduleReview({
      rating,
      fsrsStateJson: mission.fsrsState,
      lastReviewAt: mission.lastReviewAt || undefined,
    })

    // Update mission with new review state
    const updated = await db.mission.update({
      where: { id: missionId },
      data: {
        nextReviewAt: result.nextReviewAt,
        fsrsState: result.fsrsStateJson,
        reviewCount: result.reviewCount,
        lastReviewAt: new Date(),
      },
    })

    // Award bonus XP for reviewing (smaller than first completion)
    const reviewXp = rating === 'again' ? 10 : rating === 'hard' ? 15 : rating === 'good' ? 25 : 35
    await db.curriculum.update({
      where: { id: mission.curriculumId },
      data: { xp: { increment: reviewXp } },
    })

    return NextResponse.json({
      mission: updated,
      reviewXp,
      nextReviewAt: result.nextReviewAt,
    })
  } catch (e: any) {
    console.error('POST /api/reviews error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
