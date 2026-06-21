// Content script — runs on DataCamp pages
// Shows a badge that Mnemo is ready to capture
// In v1.2, the actual detection happens via chrome.scripting.executeScript
// from the popup (more reliable than running on every page load)

console.log('[Mnemo Bridge v1.2] Content script loaded on', window.location.href)

function injectBadge() {
  if (document.getElementById('mnemo-badge')) return

  const badge = document.createElement('div')
  badge.id = 'mnemo-badge'
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #047857);
    color: #0a0a0a;
    padding: 10px 16px;
    border-radius: 999px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
    z-index: 99999;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  `
  badge.innerHTML = '<span>🧠</span> Mnemo prêt · cliquez sur l\'icône extension'
  badge.title = 'Cliquez sur l\'icône Mnemo (en haut à droite de Chrome) pour capturer ce cours'
  badge.onmouseenter = () => {
    badge.style.transform = 'translateY(-2px) scale(1.02)'
    badge.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)'
  }
  badge.onmouseleave = () => {
    badge.style.transform = 'translateY(0) scale(1)'
    badge.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)'
  }

  document.body.appendChild(badge)

  // Auto-fade after 8 seconds (still clickable but less intrusive)
  setTimeout(() => {
    if (badge && badge.parentNode) {
      badge.style.opacity = '0.7'
      badge.style.transition = 'opacity 0.5s'
    }
  }, 8000)
}

// Inject after page is fully loaded
if (document.readyState === 'complete') {
  setTimeout(injectBadge, 1500)
} else {
  window.addEventListener('load', () => setTimeout(injectBadge, 1500))
}

// Re-inject on SPA navigation (DataCamp is a SPA)
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    setTimeout(injectBadge, 1500)
  }
})
observer.observe(document.body, { childList: true, subtree: true })
