// Reset the database to a clean state - keeps only the 5 curricula, removes missions, agents, conversations
import { db } from '../src/lib/db'

async function main() {
  console.log('Resetting database to clean state...')

  // Delete in order (respecting foreign keys)
  const deletedConvos = await db.agentConversation.deleteMany({})
  console.log(`  Deleted ${deletedConvos.count} conversations`)

  const deletedSubs = await db.missionSubmission.deleteMany({})
  console.log(`  Deleted ${deletedSubs.count} submissions`)

  const deletedMissions = await db.mission.deleteMany({})
  console.log(`  Deleted ${deletedMissions.count} missions`)

  const deletedAgents = await db.agent.deleteMany({})
  console.log(`  Deleted ${deletedAgents.count} agents`)

  // Reset curriculum XP and level
  await db.curriculum.updateMany({
    data: { xp: 0, level: 1 },
  })
  console.log('  Reset all curricula to level 1, 0 XP')

  // Verify
  const curricula = await db.curriculum.findMany()
  console.log(`\nFinal state: ${curricula.length} curricula`)
  for (const c of curricula) {
    console.log(`  - ${c.name}: level ${c.level}, ${c.xp} XP`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
