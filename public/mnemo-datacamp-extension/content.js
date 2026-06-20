// Content script — runs on DataCamp pages
// Detects course content and provides visual indicator

console.log('[Mnemo Bridge] Content script loaded on', window.location.hostname)

// Add a small floating badge on DataCamp pages to show the extension is active
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
    padding: 8px 14px;
    border-radius: 999px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 11px;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    z-index: 99999;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: transform 0.2s;
  `
  badge.innerHTML = '<span>🧠</span> Mnemo prêt à capturer'
  badge.title = 'Cliquez sur l\'icône Mnemo dans la barre d\'extensions pour capturer ce cours'
  badge.onmouseenter = () => badge.style.transform = 'translateY(-2px)'
  badge.onmouseleave = () => badge.style.transform = 'translateY(0)'

  document.body.appendChild(badge)

  // Auto-hide after 5 seconds
  setTimeout(() => {
    badge.style.opacity = '0.6'
  }, 5000)
}

// Inject after a delay to let the page load
if (document.readyState === 'complete') {
  setTimeout(injectBadge, 1500)
} else {
  window.addEventListener('load', () => setTimeout(injectBadge, 1500))
}
