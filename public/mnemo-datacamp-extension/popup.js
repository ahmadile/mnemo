// Mnemo DataCamp Bridge v2.0.0 — popup script
// v2.0.0:
//   - Scrapes full hierarchy: Cursus → Cours → Chapitres → Séquences/Exercices
//   - Displays chapters list on course pages, courses list on curriculum pages
//   - Supports classroom.datacamp.com exercise pages with exercise/chapter detection
//   - Sends chapters, courses, chapterTitle, exerciseTitle to Mnemo backend
//   - Creates parent/child curriculum relationships automatically

const statusDot = document.getElementById('statusDot')
const statusText = document.getElementById('statusText')
const serverUrlInput = document.getElementById('serverUrl')
const captureBtn = document.getElementById('captureBtn')
const refreshBtn = document.getElementById('refreshBtn')
const openAppBtn = document.getElementById('openAppBtn')
const contextSection = document.getElementById('contextSection')
const notDatacampSection = document.getElementById('notDatacampSection')
const captureSection = document.getElementById('captureSection')
const loadingSection = document.getElementById('loadingSection')
const loadingText = document.getElementById('loadingText')
const preview = document.getElementById('preview')
const toast = document.getElementById('toast')
const dcCourseTitle = document.getElementById('dcCourseTitle')
const dcCurriculumTitle = document.getElementById('dcCurriculumTitle')
const dcMeta = document.getElementById('dcMeta')
const dcHierarchyList = document.getElementById('dcHierarchyList')

let detectedContext = null

chrome.storage.local.get(['mnemoServerUrl'], (result) => {
  if (result.mnemoServerUrl) serverUrlInput.value = result.mnemoServerUrl
})

serverUrlInput.addEventListener('change', () => {
  chrome.storage.local.set({ mnemoServerUrl: serverUrlInput.value })
  init()
})

async function init() {
  setStatus('gray', 'Vérification...')
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const isDataCamp = tab?.url?.includes('datacamp.com')
  const url = serverUrlInput.value.replace(/\/$/, '')
  const serverOk = await checkServer(url)

  if (!serverOk.ok) {
    setStatus('error', 'Serveur Mnemo injoignable')
    notDatacampSection.style.display = 'block'
    const isLocal = /localhost|127\.0\.0\.1/.test(url)
    const localHints = `
        • Mnemo n'est pas démarré (lancez <code style="color:#fbbf24;">npm run dev</code>)<br>
        • Le port 3000 est déjà utilisé par une autre app`
    const remoteHints = `
        • L'URL doit commencer par <code style="color:#fbbf24;">https://</code> (ex. Vercel)<br>
        • Rechargez l'extension dans <code style="color:#fbbf24;">chrome://extensions/</code> (v1.3.1+ requis pour Vercel)<br>
        • Vérifiez que le déploiement Vercel est en ligne`
    notDatacampSection.innerHTML = `
      <div class="info" style="background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3);">
        <strong style="color:#ef4444;">Serveur Mnemo injoignable</strong><br>
        Impossible de joindre <code style="color:#fbbf24;">${url}</code>.
        ${serverOk.detail ? `<br><span style="color:#a1a1aa;font-size:10px;">${serverOk.detail}</span>` : ''}
        <br><br>
        <span style="color:#a1a1aa;">Causes possibles :</span><br>
        • L'URL dans le champ ci-dessus est incorrecte<br>
        ${isLocal ? localHints : remoteHints}
      </div>
    `
    return
  }

  if (!isDataCamp) {
    setStatus('gray', 'Pas sur DataCamp')
    notDatacampSection.style.display = 'block'
    notDatacampSection.innerHTML = `
      <div class="info">
        Naviguez vers <strong>app.datacamp.com</strong> pour activer la capture automatique.
      </div>
    `
    return
  }

  setStatus('datacamp', 'DataCamp détecté · Mnemo connecté')
  notDatacampSection.style.display = 'none'
  await detectDataCampContext(tab.id)
}

async function checkServer(url) {
  if (!url || !/^https?:\/\//.test(url)) {
    return { ok: false, detail: 'URL invalide (http:// ou https:// requis)' }
  }
  try {
    const res = await fetch(`${url}/api/curricula`, { method: 'GET' })
    if (res.ok) return { ok: true }
    return { ok: false, detail: `Le serveur a répondu HTTP ${res.status}` }
  } catch (e) {
    const msg = e?.message || 'Erreur réseau'
    const likelyPermission =
      !/localhost|127\.0\.0\.1/.test(url) &&
      (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return {
      ok: false,
      detail: likelyPermission
        ? 'Chrome bloque peut-être la requête — mettez à jour l\'extension (v1.3.1+) et rechargez-la'
        : msg,
    }
  }
}

async function detectDataCampContext(tabId) {
  if (!chrome.scripting) {
    showToast('Permission "scripting" manquante. Rechargez l\'extension.', true)
    return
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      function: extractDataCampContext,
    })

    if (!results || !results[0]) {
      showToast('Impossible d\'analyser la page DataCamp', true)
      return
    }

    detectedContext = results[0].result
    console.log('[Mnemo v1.3] Detected context:', detectedContext)

    contextSection.style.display = 'block'
    captureSection.style.display = 'block'

    dcCourseTitle.textContent = detectedContext.courseTitle || 'Cours inconnu'
    dcCurriculumTitle.textContent = detectedContext.curriculumTitle
      ? `Cursus : ${detectedContext.curriculumTitle}`
      : 'Cursus standalone'

    dcMeta.innerHTML = ''
    if (detectedContext.pageType) {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.textContent = detectedContext.pageType
      dcMeta.appendChild(chip)
    }
    if (detectedContext.detectedLanguage) {
      const chip = document.createElement('span')
      chip.className = 'chip lang'
      chip.textContent = detectedContext.detectedLanguage.toUpperCase()
      dcMeta.appendChild(chip)
    }
    if (detectedContext.chapterTitle && detectedContext.chapterTitle !== 'APPRENTISSAGE') {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.style.background = 'rgba(168,85,247,0.15)'
      chip.style.color = '#d8b4fe'
      chip.style.borderColor = 'rgba(168,85,247,0.3)'
      chip.textContent = '📖 ' + detectedContext.chapterTitle.slice(0, 30)
      dcMeta.appendChild(chip)
    }
    if (detectedContext.exerciseTitle) {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.style.background = 'rgba(236,72,153,0.15)'
      chip.style.color = '#fbcfe8'
      chip.style.borderColor = 'rgba(236,72,153,0.3)'
      chip.textContent = '🎯 ' + detectedContext.exerciseTitle.slice(0, 30)
      dcMeta.appendChild(chip)
    }

    // Show progress info if we scraped completed courses
    if (detectedContext.completedCourses && detectedContext.completedCourses.length > 0) {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.style.background = 'rgba(16,185,129,0.15)'
      chip.style.color = '#34d399'
      chip.style.borderColor = 'rgba(16,185,129,0.3)'
      chip.textContent = `✓ ${detectedContext.completedCourses.length} cours complétés`
      dcMeta.appendChild(chip)
    }
    // Show progress percentage
    if (detectedContext.progress && detectedContext.progress > 0) {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.style.background = 'rgba(59,130,246,0.15)'
      chip.style.color = '#93c5fd'
      chip.style.borderColor = 'rgba(59,130,246,0.3)'
      chip.textContent = `📊 ${detectedContext.progress}% sur DataCamp`
      dcMeta.appendChild(chip)
    }

    // Render hierarchy list
    dcHierarchyList.innerHTML = ''
    dcHierarchyList.style.display = 'none'

    if (detectedContext.pageType === 'curriculum' && detectedContext.courses && detectedContext.courses.length > 0) {
      dcHierarchyList.style.display = 'block'
      dcHierarchyList.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px; color: #e4e4e7; font-size: 11px;">📚 Cours du Cursus (${detectedContext.courses.length}) :</div>
        <ul style="list-style: none; padding-left: 0; max-height: 120px; overflow-y: auto;">
          ${detectedContext.courses.map((c, i) => `<li style="margin-bottom: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-size: 10px; color: #a1a1aa;">${i + 1}. ${c}</li>`).join('')}
        </ul>
      `
    } else if (detectedContext.pageType === 'course' && detectedContext.chapters && detectedContext.chapters.length > 0) {
      dcHierarchyList.style.display = 'block'
      dcHierarchyList.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px; color: #e4e4e7; font-size: 11px;">📖 Chapitres du Cours (${detectedContext.chapters.length}) :</div>
        <ul style="list-style: none; padding-left: 0; max-height: 120px; overflow-y: auto;">
          ${detectedContext.chapters.map((ch, i) => `<li style="margin-bottom: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-size: 10px; color: #a1a1aa;">${i + 1}. ${ch}</li>`).join('')}
        </ul>
      `
    } else if (detectedContext.pageType === 'exercise') {
      dcHierarchyList.style.display = 'block'
      dcHierarchyList.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px; color: #e4e4e7; font-size: 11px;">🎯 Exercice Actif :</div>
        <div style="color: #fbcfe8; font-family: monospace; font-size: 12px; font-weight: bold; padding: 6px 8px; background: rgba(236,72,153,0.1); border-radius: 4px; border: 1px solid rgba(236,72,153,0.2);">
          ${detectedContext.exerciseTitle || 'Non détecté'}
        </div>
        ${detectedContext.chapterTitle ? `
          <div style="margin-top: 6px; font-size: 10px; color: #71717a;">
            Chapitre : <span style="color: #d8b4fe; font-weight: 600;">${detectedContext.chapterTitle}</span>
          </div>
        ` : ''}
      `
    }
  } catch (e) {
    console.error('[Mnemo] detect error:', e)
    showToast('Erreur détection: ' + e.message, true)
  }
}

captureBtn.addEventListener('click', async () => {
  if (!detectedContext) {
    showToast('Aucun contexte détecté. Rafraîchissez.', true)
    return
  }

  captureSection.style.display = 'none'
  loadingSection.style.display = 'block'
  setLoading('Extraction du contenu...')

  try {
    const url = serverUrlInput.value.replace(/\/$/, '')

    // 1. Find or create the Mnemo curriculum (and sync progress + completed courses)
    setLoading('Création du cursus Mnemo...')
    const detectRes = await fetch(`${url}/api/datacamp/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: detectedContext.url,
        courseTitle: detectedContext.courseTitle,
        curriculumTitle: detectedContext.curriculumTitle,
        chapterTitle: detectedContext.chapterTitle,
        pageType: detectedContext.pageType,
        detectedLanguage: detectedContext.detectedLanguage,
        completedCourses: detectedContext.completedCourses || [],
        progress: detectedContext.progress || 0,
        courses: detectedContext.courses || [],
        chapters: detectedContext.chapters || [],
      }),
    })
    const detectData = await detectRes.json()
    if (!detectRes.ok) throw new Error(detectData.error || 'Échec détection cursus')

    const curriculumId = detectData.curriculum.id
    showToast(detectData.created
      ? `Cursus créé: ${detectData.curriculum.name}`
      : `Cursus trouvé: ${detectData.curriculum.name}`
    )

    // 2. Extract content
    setLoading('Extraction du contenu du cours...')
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const extractResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractDataCampContent,
    })

    const content = extractResults?.[0]?.result || ''
    if (!content || content.length < 50) {
      throw new Error('Contenu trop court. Êtes-vous bien sur un exercice DataCamp ?')
    }

    preview.style.display = 'block'
    preview.textContent = content.slice(0, 400) + '...'

    // 3. Generate the mission
    setLoading('Génération de la mission par l\'IA...')
    const missionRes = await fetch(`${url}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        curriculumId,
        courseContent: content,
        courseLink: detectedContext.url,
        chapterTitle: detectedContext.chapterTitle,
        exerciseTitle: detectedContext.exerciseTitle,
      }),
    })
    const missionData = await missionRes.json()
    if (!missionRes.ok) throw new Error(missionData.error || 'Échec génération mission')

    showToast(`Mission générée: ${missionData.mission.title}`)
    chrome.tabs.create({ url: `${url}/?mission=${missionData.mission.id}` })
    setTimeout(() => window.close(), 1500)
  } catch (e) {
    console.error('[Mnemo] Capture error:', e)
    showToast(e.message || 'Erreur inconnue', true)
    captureSection.style.display = 'block'
    loadingSection.style.display = 'none'
  }
})

function setLoading(text) { loadingText.textContent = text }
function setStatus(dotClass, text) {
  statusDot.className = 'status-dot ' + dotClass
  statusText.textContent = text
}

refreshBtn.addEventListener('click', init)
openAppBtn.addEventListener('click', () => chrome.tabs.create({ url: serverUrlInput.value }))

function showToast(msg, isError = false) {
  toast.textContent = msg
  toast.className = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => toast.classList.remove('show'), 4000)
}

// === Functions injected into the DataCamp page (v1.3 — scoped detection) ===

function extractDataCampContext() {
  const url = window.location.href

  // --- STEP 1: Find the MAIN content area (exclude sidebar/nav) ---
  const mainEl = document.querySelector('main') ||
                 document.querySelector('[role="main"]') ||
                 document.querySelector('[class*="main__content"]') ||
                 document.body

  // --- STEP 2: Detect page type from URL ---
  let pageType = 'unknown'
  if (url.includes('/learn/courses/')) pageType = 'course'
  if (url.includes('/learn/career-tracks/') || url.includes('/learn/skill-tracks/')) pageType = 'curriculum'
  if (url.includes('classroom.datacamp.com') || mainEl.querySelector('[class*="WorkspaceBody"], [class*="exercise__content"], [class*="ExerciseSlide"]')) {
    pageType = 'exercise'
  }

  // --- STEP 3: Course title & Exercise title ---
  let courseTitle = ''
  let exerciseTitle = ''
  let chapterTitle = ''

  if (pageType === 'exercise') {
    // For classroom.datacamp.com, split document.title (format: "Exercise Name | Course Name | DataCamp")
    const titleParts = document.title.split('|').map(p => p.trim())
    if (titleParts.length >= 2) {
      exerciseTitle = titleParts[0]
      courseTitle = titleParts[1]
    } else {
      exerciseTitle = titleParts[0]
    }

    // Try to get exercise title from DOM
    if (!exerciseTitle) {
      const exerciseEl = document.querySelector('[class*="ExerciseTitle"], [class*="exercise-title"], h1, h2, h3, h4, h5')
      if (exerciseEl) exerciseTitle = exerciseEl.innerText.trim()
    }

    // Try to get course title from DOM link
    if (!courseTitle || courseTitle.length < 3) {
      const courseEl = document.querySelector('[class*="courseTitle"], [class*="CourseTitle"], [class*="course-title"], a[href*="/courses/"]')
      if (courseEl) courseTitle = courseEl.innerText.trim()
    }

    // Try to get chapter title
    const chapterEl = document.querySelector(
      '[class*="ChapterTitle"], [class*="chapter__title"], [data-testid="chapter-title"], [class*="chapterTitle"], [class*="chapter-name"]'
    )
    if (chapterEl && chapterEl.innerText.trim()) {
      chapterTitle = chapterEl.innerText.trim().slice(0, 80)
    }
  } else {
    // For standard course/curriculum pages
    const mainH1 = mainEl.querySelector('h1')
    if (mainH1 && mainH1.innerText.trim()) {
      courseTitle = mainH1.innerText.trim()
    }
    if (!courseTitle || courseTitle.length < 3) {
      courseTitle = document.title.replace(/\s*[-|]\s*DataCamp.*$/i, '').trim() || 'Cours DataCamp'
    }
  }

  // --- STEP 4: Curriculum title ---
  let curriculumTitle = ''
  const allMainText = mainEl.innerText || ''
  const cursusMatch = allMainText.match(/CURSUS\s+(PROFESSIONNEL|DE COMP[ÉE]TENCES)\s*\n([^\n]+)/i)
  if (cursusMatch && cursusMatch[2]) {
    curriculumTitle = cursusMatch[2].trim()
  }
  if (!curriculumTitle) {
    const trackH = mainEl.querySelector('[class*="TrackHeader__title"], [class*="careerTrack"]')
    if (trackH && trackH.innerText.trim().length > 3) {
      curriculumTitle = trackH.innerText.trim().split('\n')[0]
    }
  }

  // --- STEP 5: Chapter title fallback ---
  if (!chapterTitle && pageType === 'exercise') {
    const chapterEl = mainEl.querySelector(
      '[class*="ChapterTitle"], [class*="chapter__title"], [data-testid="chapter-title"]'
    )
    if (chapterEl && chapterEl.innerText.trim()) {
      chapterTitle = chapterEl.innerText.trim().slice(0, 80)
    }
  }

  // --- STEP 6: Language detection ---
  const titleText = `${courseTitle} ${curriculumTitle} ${url}`.toLowerCase()
  let detectedLanguage = 'python'
  if (/\bsql\b/.test(titleText) || titleText.includes('postgres') || titleText.includes('mysql')) {
    detectedLanguage = 'sql'
  } else if (/\br\b/.test(titleText) || titleText.includes('tidyverse') || titleText.includes('rstudio')) {
    detectedLanguage = 'r'
  } else if (titleText.includes('javascript') || titleText.includes(' js ') || titleText.includes('node')) {
    detectedLanguage = 'javascript'
  } else if (titleText.includes('shell') || titleText.includes('bash') || titleText.includes('terminal')) {
    detectedLanguage = 'shell'
  } else if (titleText.includes('java ') && !titleText.includes('javascript')) {
    detectedLanguage = 'java'
  }

  // --- STEP 7: Scrape completed courses (green checkmarks) ---
  const completedCourses = []
  const courseLinks = mainEl.querySelectorAll('a[href*="/learn/courses/"]')
  courseLinks.forEach((link) => {
    const href = link.getAttribute('href') || ''
    if (href === window.location.pathname) return
    const parent = link.closest('li, div, article, [class*="course"]')
    if (!parent) return
    const hasCheckmark = parent.querySelector(
      'svg[class*="check"], [class*="completed"], [class*="Completed"], [data-testid*="completed"]'
    )
    const greenEl = parent.querySelector('[style*="color: rgb(51, 170, 51)"], [class*="success"]')
    if (hasCheckmark || greenEl) {
      const title = link.innerText.trim() || link.querySelector('h3, h4')?.innerText?.trim() || ''
      if (title && title.length > 3 && title.length < 200) {
        completedCourses.push({ title, url: link.href })
      }
    }
  })

  const allCompletedLabels = mainEl.querySelectorAll('[class*="completed"], [class*="Completed"]')
  allCompletedLabels.forEach((el) => {
    const text = el.innerText?.trim()
    if (text && (text === 'Terminé' || text === 'Completed' || text.includes('✓'))) {
      const container = el.closest('li, div, article, [class*="course"]')
      if (container) {
        const titleEl = container.querySelector('h3, h4, [class*="title"]')
        if (titleEl) {
          const title = titleEl.innerText.trim()
          if (title && title.length > 3 && !completedCourses.find((c) => c.title === title)) {
            completedCourses.push({ title, url: '' })
          }
        }
      }
    }
  })

  // --- STEP 8: Extract progress percentage ---
  let progress = 0
  const progressMatch = allMainText.match(/PROGR[ÈE]S\s+DU\s+CURSUS\s*\n?\s*(\d{1,3})\s*%/i)
  if (progressMatch && progressMatch[1]) {
    progress = parseInt(progressMatch[1], 10)
  }
  if (progress === 0) {
    const progressBar = mainEl.querySelector('[role="progressbar"], [class*="ProgressBar"]')
    if (progressBar) {
      const valuenow = progressBar.getAttribute('aria-valuenow')
      if (valuenow) progress = parseInt(valuenow, 10) || 0
    }
  }

  // --- STEP 9: Scrape chapters list if on course page or courses list if on curriculum page ---
  const chapters = []
  const courses = []

  if (pageType === 'course') {
    const chapterEls = mainEl.querySelectorAll('[class*="ChapterTitle"], [class*="chapter__title"], [class*="ChapterCard__title"], h3, h4')
    chapterEls.forEach((el) => {
      const text = el.innerText.trim()
      if (text && text.length > 3 && text.length < 80 && !text.includes('PROGRÈS') && !text.includes('CURSUS') && !text.includes(courseTitle)) {
        if (!chapters.includes(text)) chapters.push(text)
      }
    })
  } else if (pageType === 'curriculum') {
    const courseEls = mainEl.querySelectorAll('a[href*="/learn/courses/"], [class*="CourseCard__title"], [class*="course-title"]')
    courseEls.forEach((el) => {
      const text = el.innerText.trim()
      if (text && text.length > 3 && text.length < 100) {
        if (!courses.includes(text)) courses.push(text)
      }
    })
  }

  return {
    url,
    courseTitle,
    curriculumTitle,
    chapterTitle,
    exerciseTitle,
    pageType,
    detectedLanguage,
    completedCourses: completedCourses.slice(0, 20),
    progress,
    chapters,
    courses,
  }
}

function extractDataCampContent() {
  const selectors = [
    '[class*="WorkspaceBody"]',
    '[class*="Instructions"]',
    '[data-testid="exercise-content"]',
    '[class*="exercise__content"]',
    '[class*="ExerciseSlide"]',
    'article',
    'main',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el && el.innerText && el.innerText.length > 100) {
      return el.innerText.trim().slice(0, 8000)
    }
  }
  const title = document.querySelector('h1, h2')?.innerText || document.title
  const body = document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 8000)
  return `${title}\n\n${body}`
}

init()
