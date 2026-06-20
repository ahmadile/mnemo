import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// All achievement definitions (catalog)
const ACHIEVEMENTS_CATALOG = [
  // --- Missions ---
  { code: 'first_mission', title: 'Première mission', description: 'Complétez votre première mission', icon: '🎯', color: '#10b981', category: 'missions', xpReward: 50, check: (s) => s.completedMissions >= 1 },
  { code: 'missions_5', title: 'Apprenti dévoué', description: 'Complétez 5 missions', icon: '⭐', color: '#3b82f6', category: 'missions', xpReward: 100, check: (s) => s.completedMissions >= 5 },
  { code: 'missions_25', title: 'Missionnaire', description: 'Complétez 25 missions', icon: '🏆', color: '#f59e0b', category: 'missions', xpReward: 250, check: (s) => s.completedMissions >= 25 },
  { code: 'missions_100', title: 'Légende', description: 'Complétez 100 missions', icon: '👑', color: '#a855f7', category: 'missions', xpReward: 1000, check: (s) => s.completedMissions >= 100 },
  // --- Streak ---
  { code: 'streak_3', title: 'Régulier', description: '3 jours consécutifs d\'activité', icon: '🔥', color: '#ef4444', category: 'streak', xpReward: 75, check: (s) => s.streak >= 3 },
  { code: 'streak_7', title: 'Une semaine', description: '7 jours consécutifs d\'activité', icon: '⚡', color: '#f59e0b', category: 'streak', xpReward: 150, check: (s) => s.streak >= 7 },
  { code: 'streak_30', title: 'Mois de fer', description: '30 jours consécutifs d\'activité', icon: '💎', color: '#06b6d4', category: 'streak', xpReward: 500, check: (s) => s.streak >= 30 },
  // --- Agents ---
  { code: 'first_agent', title: 'Naissance', description: 'Donnez naissance à votre premier agent-mémoire', icon: '🧠', color: '#10b981', category: 'agents', xpReward: 100, check: (s) => s.agentsCount >= 1 },
  { code: 'agents_3', title: 'Réseau naissant', description: 'Ayez 3 agents-mémoire simultanément', icon: '🌐', color: '#a855f7', category: 'agents', xpReward: 300, check: (s) => s.agentsCount >= 3 },
  { code: 'agents_5', title: 'Maître des esprits', description: 'Ayez 5 agents-mémoire (un par domaine)', icon: '🔮', color: '#fbbf24', category: 'agents', xpReward: 1000, check: (s) => s.agentsCount >= 5 },
  // --- Exploration ---
  { code: 'first_curriculum', title: 'Premier pas', description: 'Créez ou importez votre premier cursus', icon: '🗺️', color: '#3b82f6', category: 'exploration', xpReward: 25, check: (s) => s.curriculaCount >= 1 },
  { code: 'curricula_3', title: 'Explorateur', description: 'Suivez 3 cursus en parallèle', icon: '🧭', color: '#10b981', category: 'exploration', xpReward: 100, check: (s) => s.curriculaCount >= 3 },
  { code: 'datacamp_sync', title: 'Pont DataCamp', description: 'Synchronisez votre progression DataCamp', icon: '🔌', color: '#3b82f6', category: 'exploration', xpReward: 50, check: (s) => s.datacampSynced },
  // --- Mastery ---
  { code: 'level_5', title: 'Niveau 5', description: 'Atteignez le niveau 5 dans un cursus', icon: '📈', color: '#f59e0b', category: 'mastery', xpReward: 200, check: (s) => s.maxLevel >= 5 },
  { code: 'level_10', title: 'Expert', description: 'Atteignez le niveau 10 dans un cursus', icon: '🎓', color: '#a855f7', category: 'mastery', xpReward: 500, check: (s) => s.maxLevel >= 10 },
  { code: 'chat_with_agent', title: 'Dialogue intérieur', description: 'Discutez avec un agent-mémoire pour la première fois', icon: '💬', color: '#06b6d4', category: 'mastery', xpReward: 50, check: (s) => s.agentChats >= 1 },
  { code: 'chats_10', title: 'Introspection', description: 'Ayez 10 conversations avec vos agents', icon: '🗣️', color: '#8b5cf6', category: 'mastery', xpReward: 150, check: (s) => s.agentChats >= 10 },
]

// GET /api/achievements
// Returns all achievements (unlocked + locked) with current status
export async function GET() {
  try {
    // Compute current stats
    const stats = await computeStats()

    // Get existing achievement records
    const existing = await db.achievement.findMany()
    const existingByCode = new Map(existing.map((a) => [a.code, a]))

    // Find newly unlocked achievements
    const newlyUnlocked: any[] = []
    for (const def of ACHIEVEMENTS_CATALOG) {
      const isUnlocked = def.check(stats)
      const record = existingByCode.get(def.code)

      if (isUnlocked && !record) {
        // Newly unlocked! Create the record
        const newRecord = await db.achievement.create({
          data: {
            code: def.code,
            title: def.title,
            description: def.description,
            icon: def.icon,
            color: def.color,
            category: def.category,
            xpReward: def.xpReward,
            unlockedAt: new Date(),
          },
        })
        newlyUnlocked.push(newRecord)
        existingByCode.set(def.code, newRecord)
      }
    }

    // Build response: catalog + unlocked status
    const achievements = ACHIEVEMENTS_CATALOG.map((def) => {
      const record = existingByCode.get(def.code)
      return {
        code: def.code,
        title: def.title,
        description: def.description,
        icon: def.icon,
        color: def.color,
        category: def.category,
        xpReward: def.xpReward,
        unlocked: !!record?.unlockedAt,
        unlockedAt: record?.unlockedAt || null,
        progress: computeProgress(def, stats),
      }
    })

    return NextResponse.json({
      achievements,
      newlyUnlocked,
      stats,
    })
  } catch (e: any) {
    console.error('GET /api/achievements error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function computeStats() {
  const curricula = await db.curriculum.findMany({
    include: {
      missions: { where: { status: 'completed' }, select: { id: true } },
      agent: { select: { id: true } },
    },
  })

  const completedMissions = curricula.reduce((sum, c) => sum + c.missions.length, 0)
  const agentsCount = curricula.filter((c) => c.agent).length
  const curriculaCount = curricula.length
  const maxLevel = curricula.reduce((max, c) => Math.max(max, c.level), 0)
  const datacampSynced = curricula.some((c) => c.datacampProgress && c.datacampProgress > 0)

  // Compute streak (consecutive days with activity)
  const oneYearAgo = new Date()
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)
  const [missionsCreated, submissions, agentsBorn, questsDone] = await Promise.all([
    db.mission.findMany({ where: { createdAt: { gte: oneYearAgo } }, select: { createdAt: true } }),
    db.missionSubmission.findMany({ where: { createdAt: { gte: oneYearAgo }, passed: true }, select: { createdAt: true } }),
    db.agent.findMany({ where: { createdAt: { gte: oneYearAgo } }, select: { createdAt: true } }),
    db.dailyQuest.findMany({ where: { completedAt: { gte: oneYearAgo } }, select: { completedAt: true } }),
  ])

  const dayMap: Record<string, number> = {}
  const addEvent = (date: Date) => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = (dayMap[key] || 0) + 1
  }
  missionsCreated.forEach((m) => addEvent(m.createdAt))
  submissions.forEach((s) => addEvent(s.createdAt))
  agentsBorn.forEach((a) => addEvent(a.createdAt))
  questsDone.forEach((q) => addEvent(q.completedAt!))

  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const count = dayMap[dateStr] || 0
    if (count > 0) {
      streak++
    } else {
      if (i === 0) continue
      break
    }
  }

  // Count agent conversations
  const agentChats = await db.agentConversation.count()

  return {
    completedMissions,
    agentsCount,
    curriculaCount,
    maxLevel,
    datacampSynced,
    streak,
    agentChats,
  }
}

function computeProgress(def: any, stats: any): { current: number; target: number } | null {
  // For numeric thresholds, return progress
  const code = def.code
  if (code === 'first_mission') return { current: stats.completedMissions, target: 1 }
  if (code === 'missions_5') return { current: stats.completedMissions, target: 5 }
  if (code === 'missions_25') return { current: stats.completedMissions, target: 25 }
  if (code === 'missions_100') return { current: stats.completedMissions, target: 100 }
  if (code === 'streak_3') return { current: stats.streak, target: 3 }
  if (code === 'streak_7') return { current: stats.streak, target: 7 }
  if (code === 'streak_30') return { current: stats.streak, target: 30 }
  if (code === 'first_agent') return { current: stats.agentsCount, target: 1 }
  if (code === 'agents_3') return { current: stats.agentsCount, target: 3 }
  if (code === 'agents_5') return { current: stats.agentsCount, target: 5 }
  if (code === 'first_curriculum') return { current: stats.curriculaCount, target: 1 }
  if (code === 'curricula_3') return { current: stats.curriculaCount, target: 3 }
  if (code === 'level_5') return { current: stats.maxLevel, target: 5 }
  if (code === 'level_10') return { current: stats.maxLevel, target: 10 }
  if (code === 'chat_with_agent') return { current: stats.agentChats, target: 1 }
  if (code === 'chats_10') return { current: stats.agentChats, target: 10 }
  return null
}
