import { NextResponse } from 'next/server'

// GET /api/virtual-world
// Returns the list of NPCs (virtual agents) that populate the 2D world.
// In a future version with multi-user, this would return other connected users.
// For now, it returns the user's agents + some flavor NPCs.
import { db } from '@/lib/db'

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: {
        curriculum: { select: { name: true, domain: true, color: true, icon: true } },
      },
    })

    // Map agents to NPCs with spawn positions on a 800x600 grid
    const agentNpcs = agents.map((a, i) => {
      const angle = (i / Math.max(agents.length, 1)) * Math.PI * 2
      return {
        id: a.id,
        kind: 'agent' as const,
        name: a.name,
        domain: a.curriculum.domain,
        color: a.curriculum.color,
        level: a.level,
        x: 400 + Math.cos(angle) * 200,
        y: 300 + Math.sin(angle) * 150,
        activity: a.activity,
        conversation: [],
      }
    })

    // Add flavor NPCs (decorative characters that wander around)
    const flavorNpcs = [
      { id: 'npc-1', kind: 'npc' as const, name: 'Sage', color: '#a855f7', x: 150, y: 150, dialogue: 'Bienvenue dans le monde de Mnemo. Les agents apparaîtront ici quand tu auras complété des cursus.' },
      { id: 'npc-2', kind: 'npc' as const, name: 'Mentor', color: '#3b82f6', x: 650, y: 450, dialogue: 'Chaque zone est un cursus. Construis des missions pour faire naître des agents.' },
      { id: 'npc-3', kind: 'npc' as const, name: 'Archiviste', color: '#f59e0b', x: 700, y: 200, dialogue: 'Les agents sont ta mémoire. Réveille-les quand tu doutes.' },
    ]

    // Add quest-giver NPC
    const questGiver = {
      id: 'quest-giver',
      kind: 'quest-giver' as const,
      name: 'Le Donneur',
      color: '#10b981',
      x: 400,
      y: 80,
      dialogue: 'Tu veux une mission? Retourne sur la Carte, choisis un cursus, et soumets un cours.',
    }

    return NextResponse.json({
      npcs: [...agentNpcs, ...flavorNpcs, questGiver],
      player: { x: 400, y: 300, color: '#10b981' },
    })
  } catch (e: any) {
    console.error('GET /api/virtual-world error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
