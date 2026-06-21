import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/missions/[id] - get a specific mission
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mission = await db.mission.findUnique({
      where: { id },
      include: {
        curriculum: true,
        submissions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    }
    return NextResponse.json({ mission })
  } catch (e: any) {
    console.error('GET /api/missions/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
