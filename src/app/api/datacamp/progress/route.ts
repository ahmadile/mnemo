import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/datacamp/progress
// Called by the Chrome extension to sync the user's progress on a DataCamp curriculum.
// Body: {
//   curriculumDomain: string,        // The Mnemo curriculum domain (e.g. "dc-developpeur-associe-python")
//   datacampUrl: string,             // The DataCamp curriculum URL
//   progress: number,                // 0-100 percentage
//   completedCourses: [{title, url}], // List of completed course titles
// }
// Stores the progress so the dashboard can show "38% completed on DataCamp"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { curriculumDomain, datacampUrl, progress, completedCourses } = body

    if (!curriculumDomain) {
      return NextResponse.json({ error: 'curriculumDomain requis' }, { status: 400 })
    }

    const curriculum = await db.curriculum.findUnique({
      where: { domain: curriculumDomain },
    })

    if (!curriculum) {
      return NextResponse.json({ error: 'Cursus introuvable' }, { status: 404 })
    }

    const updated = await db.curriculum.update({
      where: { id: curriculum.id },
      data: {
        datacampUrl: datacampUrl || curriculum.datacampUrl,
        datacampProgress: typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : curriculum.datacampProgress,
        completedCourses: JSON.stringify(completedCourses || []),
      },
    })

    return NextResponse.json({
      curriculum: updated,
      synced: {
        progress: updated.datacampProgress,
        completedCount: (completedCourses || []).length,
      },
    })
  } catch (e: any) {
    console.error('POST /api/datacamp/progress error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
