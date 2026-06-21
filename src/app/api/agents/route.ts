import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agents - list all agents
export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: {
        curriculum: { select: { name: true, domain: true, color: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ agents })
  } catch (e: any) {
    console.error('GET /api/agents error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
