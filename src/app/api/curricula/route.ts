import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/curricula - list all curricula with their missions and agent
export async function GET() {
  try {
    const curricula = await db.curriculum.findMany({
      include: {
        missions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, difficulty: true, xp: true },
        },
        agent: { select: { id: true, name: true, level: true, status: true, activity: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ curricula })
  } catch (e: any) {
    console.error('GET /api/curricula error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
