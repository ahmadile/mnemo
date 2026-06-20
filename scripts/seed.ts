// Seed script: creates the 5 default curricula if they don't exist
import { db } from '../src/lib/db'

const curricula = [
  {
    name: 'Python',
    domain: 'python',
    description: "Le langage qui ouvre toutes les portes : scripts, data, IA, web. Maîtrisez les fondamentaux avant de viser plus haut.",
    icon: 'python',
    color: '#3B82F6',
  },
  {
    name: 'SQL',
    domain: 'sql',
    description: "Le langage des bases de données. Sans SQL, pas de data science, pas d'IA, pas de back-end digne de ce nom.",
    icon: 'database',
    color: '#10B981',
  },
  {
    name: 'Ingénierie IA',
    domain: 'ai-engineering',
    description: "Concevoir, entraîner, déployer des modèles. Le terrain de jeu des architectes d'intelligence.",
    icon: 'brain-circuit',
    color: '#A855F7',
  },
  {
    name: 'Data Science',
    domain: 'data-science',
    description: "Transformer la donnée brute en décisions. Statistiques, visualisation, storytelling.",
    icon: 'chart-line',
    color: '#F59E0B',
  },
  {
    name: 'Développement Web',
    domain: 'web-dev',
    description: "Construire le web, du HTML statique aux apps temps réel. Front, back, full-stack.",
    icon: 'code',
    color: '#EF4444',
  },
]

async function seed() {
  console.log('Seeding curricula...')
  for (const c of curricula) {
    const existing = await db.curriculum.findUnique({ where: { domain: c.domain } })
    if (!existing) {
      await db.curriculum.create({ data: c })
      console.log(`  + Created curriculum: ${c.name}`)
    } else {
      console.log(`  - Already exists: ${c.name}`)
    }
  }
  console.log('Seed complete')
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
