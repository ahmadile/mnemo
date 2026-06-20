// Mnemo DataCamp Bridge v1.2 — popup script
// Detects DataCamp course context and sends to Mnemo with auto-curriculum creation

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

let detectedContext = null

// Load saved server URL
chrome.storage.local.get(['mnemoServerUrl'], (result) => {
  if (result.mnemoServerUrl) {
    serverUrlInput.value = result.mnemoServerUrl
  }
})

serverUrlInput.addEventListener('change', () => {
  chrome.storage.local.set({ mnemoServerUrl: serverUrlInput.value })
  init()
})

async function init() {
  setStatus('gray', 'Vérification...')

  // 1. Check current tab is DataCamp
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const isDataCamp = tab?.url?.includes('datacamp.com')

  // 2. Check Mnemo server connectivity
  const url = serverUrlInput.value.replace(/\/$/, '')
  const serverOk = await checkServer(url)

  if (!serverOk) {
    setStatus('error', 'Serveur Mnemo injoignable')
    notDatacampSection.style.display = 'block'
    notDatacampSection.innerHTML = `
      <div class="info" style="background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3);">
        <strong style="color:#ef4444;">Serveur Mnemo injoignable</strong><br>
        Vérifiez que Mnemo tourne sur <code style="color:#fbbf24;">${url}</code>.
        <br><br>
        <span style="color:#a1a1aa;">Causes possibles :</span><br>
        • Mnemo n'est pas démarré (lancez <code style="color:#fbbf24;">bun run dev</code>)<br>
        • L'URL dans le champ ci-dessus est incorrecte<br>
        • Le port 3000 est déjà utilisé par une autre app
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

  // 3. We're on DataCamp + server OK → detect context
  setStatus('datacamp', 'DataCamp détecté · Mnemo connecté')
  notDatacampSection.style.display = 'none'

  await detectDataCampContext(tab.id)
}

async function checkServer(url) {
  try {
    const res = await fetch(`${url}/api/curricula`, { method: 'GET' })
    return res.ok
  } catch (e) {
    return false
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
    console.log('[Mnemo] Detected DataCamp context:', detectedContext)

    // Populate UI
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
    if (detectedContext.chapterTitle) {
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.style.background = 'rgba(168,85,247,0.15)'
      chip.style.color = '#d8b4fe'
      chip.style.borderColor = 'rgba(168,85,247,0.3)'
      chip.textContent = 'Chapitre : ' + detectedContext.chapterTitle.slice(0, 30)
      dcMeta.appendChild(chip)
    }
  } catch (e) {
    console.error('[Mnemo] detect error:', e)
    showToast('Erreur détection: ' + e.message, true)
  }
}

// Capture & send
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

    // 1. Find or create the Mnemo curriculum matching this DataCamp context
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
      }),
    })
    const detectData = await detectRes.json()
    if (!detectRes.ok) throw new Error(detectData.error || 'Échec détection cursus')

    const curriculumId = detectData.curriculum.id
    showToast(detectData.created
      ? `Cursus créé: ${detectData.curriculum.name}`
      : `Cursus trouvé: ${detectData.curriculum.name}`
    )

    // 2. Show preview
    setLoading('Extraction du contenu...')
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
      }),
    })
    const missionData = await missionRes.json()
    if (!missionRes.ok) throw new Error(missionData.error || 'Échec génération mission')

    showToast(`Mission générée: ${missionData.mission.title}`)

    // 4. Open Mnemo on the mission
    chrome.tabs.create({ url: `${url}/?mission=${missionData.mission.id}` })

    setTimeout(() => window.close(), 1500)
  } catch (e) {
    console.error('[Mnemo] Capture error:', e)
    showToast(e.message || 'Erreur inconnue', true)
    captureSection.style.display = 'block'
    loadingSection.style.display = 'none'
  }
})

function setLoading(text) {
  loadingText.textContent = text
}

function setStatus(dotClass, text) {
  statusDot.className = 'status-dot ' + dotClass
  statusText.textContent = text
}

refreshBtn.addEventListener('click', init)
openAppBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: serverUrlInput.value })
})

function showToast(msg, isError = false) {
  toast.textContent = msg
  toast.className = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => toast.classList.remove('show'), 4000)
}

// === Functions injected into the DataCamp page ===

// Extract structured context (cursus, course, chapter) from the DataCamp page
function extractDataCampContext() {
  const url = window.location.href

  // Detect page type from URL
  let pageType = 'unknown'
  if (url.includes('/courses/') && !url.includes('/courses')) {
    pageType = 'course'
  }
  if (url.includes('/learn/courses/')) pageType = 'course'
  if (url.includes('/learn/career-tracks/') || url.includes('/learn/skill-tracks/')) pageType = 'curriculum'
  if (document.querySelector('[class*="WorkspaceBody"], [class*="exercise__content"], [class*="ExerciseSlide"]')) {
    pageType = 'exercise'
  }

  // Course title: look for h1 in main content
  let courseTitle = ''
  const h1 = document.querySelector('h1')
  if (h1 && h1.innerText.trim()) {
    courseTitle = h1.innerText.trim()
  }
  // Fallback: page title
  if (!courseTitle || courseTitle.length < 3) {
    courseTitle = document.title.replace(/\s*[-|]\s*DataCamp.*$/i, '').trim() || 'Cours DataCamp'
  }

  // Curriculum title: DataCamp shows it in a banner like "CURSUS PROFESSIONNEL" + title
  let curriculumTitle = ''
  const trackBadge = Array.from(document.querySelectorAll('[class*="TrackHeader"], [class*="CareerTrack"], [class*="title"]'))
    .find((el) => el.innerText && el.innerText.length > 3 && el.innerText.length < 200)
  if (trackBadge) {
    curriculumTitle = trackBadge.innerText.trim().split('\n')[0]
  }

  // Look for the "CURSUS PROFESSIONNEL" or "CURSUS DE COMPÉTENCES" label and the title right after
  const allText = document.body.innerText
  const cursusMatch = allText.match(/CURSUS\s+(PROFESSIONNEL|DE COMP[ÉE]TENCES)\s*\n([^\n]+)/i)
  if (cursusMatch && cursusMatch[2]) {
    curriculumTitle = cursusMatch[2].trim()
  }

  // Chapter title (visible during exercise)
  let chapterTitle = ''
  const chapterEl = document.querySelector('[class*="ChapterTitle"], [class*="chapter__title"], h2')
  if (chapterEl && chapterEl.innerText.trim()) {
    chapterTitle = chapterEl.innerText.trim().slice(0, 80)
  }

  // Detect language from page content
  const pageText = (courseTitle + ' ' + curriculumTitle + ' ' + allText.slice(0, 2000)).toLowerCase()
  let detectedLanguage = 'python'
  if (pageText.includes('sql') || pageText.includes('postgres')) detectedLanguage = 'sql'
  else if (pageText.includes(' r ') || pageText.includes('tidyverse') || pageText.includes('rstudio')) detectedLanguage = 'r'
  else if (pageText.includes('javascript') || pageText.includes('node')) detectedLanguage = 'javascript'
  else if (pageText.includes('shell') || pageText.includes('bash')) detectedLanguage = 'shell'

  return {
    url,
    courseTitle,
    curriculumTitle,
    chapterTitle,
    pageType,
    detectedLanguage,
  }
}

// Extract the actual course content (instructions, code samples, context)
function extractDataCampContent() {
  // Strategy 1: Try DataCamp-specific selectors (most reliable)
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

  // Strategy 2: Title + body text (less precise but always works)
  const title = document.querySelector('h1, h2')?.innerText || document.title
  const body = document.body.innerText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)

  return `${title}\n\n${body}`
}

// Initial load
init()
