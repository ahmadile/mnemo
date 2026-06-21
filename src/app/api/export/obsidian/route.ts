import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/export/obsidian
// Returns a ZIP-ready structure of Markdown files for Obsidian import
// Each completed mission becomes a Markdown file with:
//   - YAML frontmatter (mnemo_id, status, next_review, curriculum, etc.)
//   - Title as H1
//   - Briefing, objectives, source content
//   - [[Wikilinks]] to related missions in the same curriculum

interface MissionForExport {
  id: string
  title: string
  briefing: string
  objectives: string
  sourceContent: string
  difficulty: string
  xp: number
  language: string
  status: string
  nextReviewAt: Date | null
  reviewCount: number
  createdAt: Date
  curriculum: {
    name: string
    domain: string
    color: string
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function formatDate(d: Date | null): string {
  if (!d) return ''
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

// Convert a mission to Obsidian-compatible Markdown
function missionToMarkdown(m: MissionForExport, allInCurriculum: MissionForExport[]): string {
  const objectives: string[] = JSON.parse(m.objectives)

  // Find related missions (same curriculum) for wikilinks
  const related = allInCurriculum
    .filter((other) => other.id !== m.id)
    .slice(0, 5)
    .map((other) => `[[${slugify(other.title)}]]`)
    .join(' · ')

  // YAML frontmatter
  const frontmatter = [
    '---',
    `mnemo_id: "${m.id}"`,
    `curriculum: "${m.curriculum.name}"`,
    `domain: "${m.curriculum.domain}"`,
    `status: "${m.status}"`,
    `difficulty: "${m.difficulty}"`,
    `language: "${m.language}"`,
    `xp: ${m.xp}`,
    `review_count: ${m.reviewCount}`,
    m.nextReviewAt ? `next_review: "${formatDate(m.nextReviewAt)}"` : '',
    `created: "${formatDate(m.createdAt)}"`,
    `tags:`,
    `  - mnemo`,
    `  - ${m.curriculum.domain}`,
    `  - ${m.difficulty}`,
    '---',
  ].filter(Boolean).join('\n')

  // Body
  const body = [
    `# ${m.title}`,
    '',
    `> ${m.briefing}`,
    '',
    '## Objectifs',
    ...objectives.map((o, i) => `${i + 1}. ${o}`),
    '',
    '## Contexte du cours',
    m.sourceContent.slice(0, 2000) || '(aucun contenu source)',
    '',
    related ? `## Notions liées\n${related}` : '',
    '',
    '---',
    `*Généré par Mnemo · [Réviser cette mission](${process.env.NEXTAUTH_URL || 'http://localhost:3000'})*`,
  ].filter(Boolean).join('\n')

  return `${frontmatter}\n\n${body}\n`
}

export async function GET() {
  try {
    const missions = await db.mission.findMany({
      where: { status: 'completed' },
      include: {
        curriculum: { select: { name: true, domain: true, color: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (missions.length === 0) {
      return NextResponse.json({
        error: 'Aucune mission complétée à exporter',
        files: [],
      })
    }

    // Group by curriculum
    const byCurriculum: Record<string, MissionForExport[]> = {}
    missions.forEach((m) => {
      const key = m.curriculum.name
      if (!byCurriculum[key]) byCurriculum[key] = []
      byCurriculum[key].push(m as MissionForExport)
    })

    // Generate Markdown files
    const files: { path: string; content: string }[] = []

    // Add README
    files.push({
      path: 'README.md',
      content: `# Vault Mnemo — Export du ${formatDate(new Date())}

Ce vault contient ${missions.length} mission(s) complétée(s) exportée(s) depuis Mnemo.

## Structure

\`\`\`
Mnemo-Vault/
├── README.md
├── ${Object.keys(byCurriculum).map((c) => `${slugify(c)}/`).join('\n├── ')}
└── .obsidian/  (créé automatiquement par Obsidian)
\`\`\`

## Comment importer dans Obsidian

1. Téléchargez et décompressez ce vault
2. Ouvrez Obsidian → "Open folder as vault"
3. Sélectionnez le dossier décompressé
4. Vos missions apparaissent avec leurs [[wikilinks]] et métadonnées

## Métadonnées

Chaque fichier Markdown contient du YAML frontmatter avec :
- \`mnemo_id\` : identifiant unique Mnemo
- \`curriculum\` : cursus parent
- \`next_review\` : prochaine révision (spaced repetition)
- \`tags\` : tags pour le filtrage Obsidian

## Graph view

Ouvrez la vue "Graph" dans Obsidian pour visualiser les liens entre vos missions.
`,
    })

    // Generate mission files grouped by curriculum
    for (const [curriculumName, curriculumMissions] of Object.entries(byCurriculum)) {
      const folder = slugify(curriculumName)
      curriculumMissions.forEach((m) => {
        const filename = `${folder}/${slugify(m.title)}.md`
        const content = missionToMarkdown(m, curriculumMissions)
        files.push({ path: filename, content })
      })
    }

    // Return as JSON (client will create the ZIP)
    // For a real ZIP, we'd use archiver, but JSON is simpler for now
    return NextResponse.json({
      vaultName: `Mnemo-Vault-${formatDate(new Date())}`,
      files,
      stats: {
        totalMissions: missions.length,
        totalCurricula: Object.keys(byCurriculum).length,
        totalFiles: files.length,
      },
    })
  } catch (e: any) {
    console.error('GET /api/export/obsidian error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
