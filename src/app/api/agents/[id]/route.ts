import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agents/[id] - get agent + conversation history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        curriculum: true,
        conversations: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })
    }
    return NextResponse.json({ agent })
  } catch (e: any) {
    console.error('GET /api/agents/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
