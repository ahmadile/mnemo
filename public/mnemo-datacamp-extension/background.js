// Background service worker
// Handles messaging between popup and content script if needed

chrome.runtime.onInstalled.addListener(() => {
  console.log('Mnemo DataCamp Bridge installed')
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CAPTURE_PAGE') {
    sendResponse({ ok: true })
  }
  return true
})
