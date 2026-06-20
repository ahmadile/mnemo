// Mnemo DataCamp Bridge — Popup script

const statusDot = document.getElementById('statusDot')
const statusText = document.getElementById('statusText')
const serverUrlInput = document.getElementById('serverUrl')
const captureBtn = document.getElementById('captureBtn')
const refreshBtn = document.getElementById('refreshBtn')
const openAppBtn = document.getElementById('openAppBtn')
const curriculumSelect = document.getElementById('curriculumSelect')
const datacampSection = document.getElementById('datacampSection')
const notDatacampSection = document.getElementById('notDatacampSection')
const preview = document.getElementById('preview')
const toast = document.getElementById('toast')

// Load saved server URL
chrome.storage.local.get(['mnemoServerUrl'], (result) => {
  if (result.mnemoServerUrl) {
    serverUrlInput.value = result.mnemoServerUrl
  }
})

serverUrlInput.addEventListener('change', () => {
  chrome.storage.local.set({ mnemoServerUrl: serverUrlInput.value })
})

// Check current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0]
  const isDataCamp = tab.url && tab.url.includes('datacamp.com')

  if (isDataCamp) {
    statusDot.classList.add('datacamp')
    statusText.textContent = 'Page DataCamp détectée'
    datacampSection.style.display = 'block'
    notDatacampSection.style.display = 'none'
  } else {
    statusDot.classList.remove('datacamp')
    statusText.textContent = 'Pas sur DataCamp'
    datacampSection.style.display = 'none'
    notDatacampSection.style.display = 'block'
  }
})

// Check Mnemo server connection
async function checkServer() {
  const url = serverUrlInput.value.replace(/\/$/, '')
  try {
    const res = await fetch(`${url}/api/curricula`)
    if (res.ok) {
      statusDot.classList.add('connected')
      if (!statusText.textContent.includes('DataCamp')) {
        statusText.textContent = 'Connecté à Mnemo'
      }
      return url
    }
  } catch (e) {
    // Server not reachable
  }
  return null
}

// Load curricula
async function loadCurricula() {
  const url = await checkServer()
  if (!url) {
    curriculumSelect.innerHTML = '<option value="">Serveur injoignable</option>'
    return
  }
  try {
    const res = await fetch(`${url}/api/curricula`)
    const data = await res.json()
    curriculumSelect.innerHTML = data.curricula
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('')
  } catch (e) {
    curriculumSelect.innerHTML = '<option value="">Erreur de chargement</option>'
  }
}

// Capture & send
captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true
  captureBtn.textContent = 'Capture en cours...'

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Inject content script to extract content
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractDataCampContent,
    }, async (results) => {
      if (!results || !results[0]) {
        showToast('Erreur d\'extraction', true)
        captureBtn.disabled = false
        captureBtn.textContent = 'Capturer & Envoyer'
        return
      }

      const content = results[0].result
      if (!content || content.length < 50) {
        showToast('Contenu trop court. Êtes-vous sur un exercice ou un cours ?', true)
        captureBtn.disabled = false
        captureBtn.textContent = 'Capturer & Envoyer'
        return
      }

      // Show preview
      preview.style.display = 'block'
      preview.textContent = content.slice(0, 400) + '...'

      // Send to Mnemo
      const url = serverUrlInput.value.replace(/\/$/, '')
      const curriculumId = curriculumSelect.value
      if (!curriculumId) {
        showToast('Sélectionnez un cursus cible', true)
        captureBtn.disabled = false
        captureBtn.textContent = 'Capturer & Envoyer'
        return
      }

      const res = await fetch(`${url}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumId,
          courseContent: content,
          courseLink: tab.url,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération')

      showToast(`Mission générée: ${data.mission.title}`)

      // Open Mnemo in new tab on the mission
      chrome.tabs.create({ url: `${url}/?mission=${data.mission.id}` })

      setTimeout(() => window.close(), 1500)
    })
  } catch (e) {
    showToast(e.message, true)
    captureBtn.disabled = false
    captureBtn.textContent = 'Capturer & Envoyer'
  }
})

// This function runs in the page context
function extractDataCampContent() {
  // Strategy 1: Try to find the main content area
  const selectors = [
    'article',
    '[data-testid="exercise-content"]',
    '[class*="exercise__content"]',
    '[class*="WorkspaceBody"]',
    '[class*="Instructions"]',
    'main',
    '.css-1ynxq3m', // common DC class
  ]

  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el && el.innerText && el.innerText.length > 100) {
      return el.innerText.trim().slice(0, 8000)
    }
  }

  // Strategy 2: Title + body text
  const title = document.querySelector('h1, h2')?.innerText || document.title
  const body = document.body.innerText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)

  return `${title}\n\n${body}`
}

refreshBtn.addEventListener('click', loadCurricula)
openAppBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: serverUrlInput.value })
})

function showToast(msg, isError = false) {
  toast.textContent = msg
  toast.style.background = isError ? '#ef4444' : '#10b981'
  toast.style.color = isError ? '#fff' : '#0a0a0a'
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 3000)
}

// Initial load
loadCurricula()
