import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/datacamp/detect
// Called by the Chrome extension after it scrapes the DataCamp page.
// Body: {
//   url: string,
//   courseTitle: string,
//   curriculumTitle?: string,
//   chapterTitle?: string,
//   pageType: 'course' | 'exercise' | 'curriculum' | 'unknown',
//   detectedLanguage?: string,
//   completedCourses?: [{title, url}],  // v1.3: courses the user already completed
//   progress?: number,                  // v1.3: 0-100 percentage
// }
// Returns: { curriculum: Curriculum, created: boolean }
// Behavior:
//   - Find or create a Mnemo curriculum matching the DataCamp curriculum/course title
//   - Sync the completed courses and progress percentage

const LANGUAGE_MAP: Record<string, { language: string; color: string; icon: string }> = {
  python: { language: 'python', color: '#3B82F6', icon: 'code' },
  sql: { language: 'sql', color: '#10B981', icon: 'database' },
  r: { language: 'python', color: '#276DC3', icon: 'chart-line' },
  shell: { language: 'python', color: '#84CC16', icon: 'code' },
  javascript: { language: 'javascript', color: '#F59E0B', icon: 'code' },
  java: { language: 'javascript', color: '#EF4444', icon: 'code' },
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      url,
      courseTitle,
      curriculumTitle,
      chapterTitle,
      pageType,
      detectedLanguage,
      completedCourses,
      progress,
    } = body

    if (!courseTitle || courseTitle.trim().length < 2) {
      return NextResponse.json(
        { error: 'courseTitle requis (minimum 2 caractères)' },
        { status: 400 }
      )
    }


    const langConfig = LANGUAGE_MAP[detectedLanguage || 'python'] || LANGUAGE_MAP.python

    let parentId: string | null = null

    // If both curriculumTitle and courseTitle are present, and they are different,
    // we find/create the parent curriculum first.
    if (curriculumTitle && courseTitle && curriculumTitle.trim().toLowerCase() !== courseTitle.trim().toLowerCase()) {
      const parentName = curriculumTitle.trim()
      const parentDomain = 'dc-' + slugify(parentName)

      let parentCurriculum = await db.curriculum.findUnique({ where: { domain: parentDomain } })
      if (!parentCurriculum) {
        parentCurriculum = await db.curriculum.create({
          data: {
            name: parentName.slice(0, 60),
            domain: parentDomain,
            description: `Cursus parent importé de DataCamp : ${parentName}`,
            icon: langConfig.icon,
            color: langConfig.color,
            language: langConfig.language,
            isCustom: true,
            datacampUrl: url,
            datacampProgress: 0,
            completedCourses: '[]',
          },
        })
        console.log(`[datacamp/detect] Created parent curriculum "${parentCurriculum.name}" (${parentDomain})`)
      }
      parentId = parentCurriculum.id
    }

    // Now, find or create the target curriculum (which is the courseTitle if parentId is set, or curriculumTitle || courseTitle if not)
    const targetName = (parentId ? courseTitle : (curriculumTitle || courseTitle)).trim()
    const domain = 'dc-' + slugify(targetName)

    // Find or create the curriculum
    let curriculum = await db.curriculum.findUnique({ where: { domain } })
    let created = false

    if (!curriculum) {
      curriculum = await db.curriculum.create({
        data: {
          name: targetName.slice(0, 60),
          domain,
          description: `Cours importé de DataCamp : ${courseTitle}${curriculumTitle ? ` (cursus: ${curriculumTitle})` : ''}`,
          icon: langConfig.icon,
          color: langConfig.color,
          language: langConfig.language,
          isCustom: true,
          datacampUrl: url,
          datacampProgress: typeof progress === 'number' ? progress : 0,
          completedCourses: JSON.stringify(completedCourses || []),
          ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
        },
      })
      created = true
      console.log(`[datacamp/detect] Created curriculum "${curriculum.name}" (${domain}) linked to parentId: ${parentId}`)
    } else {
      // Update existing curriculum with the latest progress + completed courses
      curriculum = await db.curriculum.update({
        where: { id: curriculum.id },
        data: {
          datacampUrl: url || curriculum.datacampUrl,
          datacampProgress: typeof progress === 'number'
            ? Math.max(curriculum.datacampProgress, progress)
            : curriculum.datacampProgress,
          completedCourses: completedCourses && completedCourses.length > 0
            ? JSON.stringify(completedCourses)
            : curriculum.completedCourses,
          ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
        },
      })
      console.log(`[datacamp/detect] Updated curriculum "${curriculum.name}" (progress: ${curriculum.datacampProgress}%)`)
    }

    return NextResponse.json({
      curriculum,
      created,
      detected: {
        language: detectedLanguage || langConfig.language,
        pageType: pageType || 'unknown',
        courseTitle,
        curriculumTitle: curriculumTitle || null,
        chapterTitle: chapterTitle || null,
        completedCoursesCount: (completedCourses || []).length,
        progress: typeof progress === 'number' ? progress : null,
      },
    })
  } catch (e: any) {
    console.error('POST /api/datacamp/detect error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
