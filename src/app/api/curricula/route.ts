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

// POST /api/curricula — create a custom curriculum
// Body: { name, description, domain (slug), color, language }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, color, language } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom du cursus doit faire au moins 2 caractères' },
        { status: 400 }
      )
    }
    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'La description doit faire au moins 10 caractères' },
        { status: 400 }
      )
    }

    // Generate a unique slug from the name
    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Math.random().toString(36).slice(2, 6)

    // Check uniqueness
    const existing = await db.curriculum.findUnique({ where: { domain: slug } })
    if (existing) {
      return NextResponse.json({ error: 'Cursus déjà existant' }, { status: 400 })
    }

    // Color palette options (pick one if not provided)
    const palette = ['#EC4899', '#14B8A6', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#EAB308']
    const finalColor = color || palette[Math.floor(Math.random() * palette.length)]

    const curriculum = await db.curriculum.create({
      data: {
        name: name.trim(),
        domain: slug,
        description: description.trim(),
        icon: 'code',
        color: finalColor,
        language: language || 'python',
        isCustom: true,
      },
    })

    return NextResponse.json({ curriculum })
  } catch (e: any) {
    console.error('POST /api/curricula error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
