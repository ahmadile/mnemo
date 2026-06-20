'use client'

import confetti from 'canvas-confetti'

export function celebrateMission() {
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24']
  // First burst from left
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6, x: 0.2 },
    colors,
    disableForReducedMotion: true,
  })
  // Second burst from right
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.8 },
      colors,
      disableForReducedMotion: true,
    })
  }, 200)
  // Center finale
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    })
  }, 400)
}

export function celebrateLevel() {
  // Bigger celebration for level up
  const colors = ['#a855f7', '#c084fc', '#10b981', '#f59e0b']
  const duration = 2000
  const end = Date.now() + duration
  ;(function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
      colors,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1 },
      colors,
      disableForReducedMotion: true,
    })
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

export function celebrateAgent() {
  // Special celebration for agent birth
  const colors = ['#10b981', '#a855f7', '#3b82f6']
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors,
    scalar: 1.2,
    disableForReducedMotion: true,
  })
}
