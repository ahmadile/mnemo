// Spaced repetition service using ts-fsrs (Free Spaced Repetition Scheduler)
// Schedules mission reviews based on the FSRS algorithm (replaces Anki's SM-2)
// See: https://github.com/open-spaced-repetition/ts-fsrs

import {
  fsrs,
  generatorParameters,
  Rating,
  createEmptyCard,
  type Card,
  type RecordLog,
} from 'ts-fsrs'

// Configure FSRS parameters
// target_retention = 0.9 means we want 90% probability of remembering
const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 365, // max 1 year between reviews
  w: [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14,
    0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
  ],
})

const f = fsrs(params)

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

// Convert our rating to FSRS Rating enum
const RATING_MAP: Record<ReviewRating, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

// Schedule the next review for a mission
// Call this when a user reviews a mission (completes it again)
export function scheduleReview(opts: {
  rating: ReviewRating
  fsrsStateJson?: string  // Previous FSRS state (from DB)
  lastReviewAt?: Date
}): {
  nextReviewAt: Date
  fsrsStateJson: string
  reviewCount: number
} {
  const { rating, fsrsStateJson, lastReviewAt } = opts

  // Load or create the FSRS card
  let card: Card
  if (fsrsStateJson && fsrsStateJson !== '{}') {
    try {
      card = JSON.parse(fsrsStateJson) as Card
    } catch {
      card = createEmptyCard()
    }
  } else {
    card = createEmptyCard()
  }

  // If we have a last review date, use it; otherwise use now
  const now = new Date()
  const reviewDate = lastReviewAt || now

  // Schedule the review
  const ratingEnum = RATING_MAP[rating]
  const result: RecordLog = f.repeat(card, reviewDate)
  const updatedCard = result[ratingEnum].card

  // Calculate next review date
  const nextReviewAt = new Date(updatedCard.due)

  return {
    nextReviewAt,
    fsrsStateJson: JSON.stringify(updatedCard),
    reviewCount: (card.reps || 0) + 1,
  }
}

// Get missions that are due for review (nextReviewAt <= now)
export function isDueForReview(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return false
  return new Date(nextReviewAt) <= new Date()
}

// Get human-readable interval
export function formatInterval(nextReviewAt: Date | null): string {
  if (!nextReviewAt) return 'Jamais'
  const now = new Date()
  const diff = new Date(nextReviewAt).getTime() - now.getTime()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return `En retard de ${Math.abs(days)}j`
  if (days === 0) return "À réviser aujourd'hui"
  if (days === 1) return 'Demain'
  if (days < 7) return `Dans ${days} jours`
  if (days < 30) return `Dans ${Math.round(days / 7)} semaines`
  if (days < 365) return `Dans ${Math.round(days / 30)} mois`
  return `Dans ${Math.round(days / 365)} an(s)`
}

// Get the FSRS stability (memory strength) from state
export function getStability(fsrsStateJson?: string): number | null {
  if (!fsrsStateJson || fsrsStateJson === '{}') return null
  try {
    const card = JSON.parse(fsrsStateJson) as Card
    return card.stability || null
  } catch {
    return null
  }
}

// Get retention probability (0-1) for a card
export function getRetention(fsrsStateJson?: string): number | null {
  if (!fsrsStateJson || fsrsStateJson === '{}') return null
  try {
    const card = JSON.parse(fsrsStateJson) as Card
    const stability = card.stability || 0
    const elapsed = card.last_review
      ? (Date.now() - new Date(card.last_review).getTime()) / (1000 * 60 * 60 * 24)
      : 0
    // FSRS retention formula: R = exp(-elapsed / stability)
    if (stability === 0) return 0
    return Math.exp(-elapsed / stability)
  } catch {
    return null
  }
}
