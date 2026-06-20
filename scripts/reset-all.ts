// Reset total : supprime TOUT (curricula, missions, agents, conversations)
// Pour repartir d'une base vierge comme demandé par l'utilisateur
import { db } from '../src/lib/db'

async function main() {
  console.log('RESET TOTAL - suppression de toutes les données...')

  const deletedConvos = await db.agentConversation.deleteMany({})
  console.log(`  Deleted ${deletedConvos.count} conversations`)

  const deletedSubs = await db.missionSubmission.deleteMany({})
  console.log(`  Deleted ${deletedSubs.count} submissions`)

  const deletedMissions = await db.mission.deleteMany({})
  console.log(`  Deleted ${deletedMissions.count} missions`)

  const deletedAgents = await db.agent.deleteMany({})
  console.log(`  Deleted ${deletedAgents.count} agents`)

  const deletedCurricula = await db.curriculum.deleteMany({})
  console.log(`  Deleted ${deletedCurricula.count} curricula`)

  const remaining = await db.curriculum.count()
  console.log(`\nFinal state: ${remaining} cursus dans la base`)
  console.log('La base est vierge. Les cursus seront créés via l\'extension DataCamp ou le bouton +.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
