'use client'

import { useEffect, useState } from 'react'
import { createAvatar } from '@dicebear/core'
import {
  avataaars,
  bottts,
  notionists,
  pixelArt,
  micah,
  miniavs,
  personas,
  adventurer,
  lorelei,
} from '@dicebear/collection'

// Style mapping per domain (consistent avatars per curriculum type)
const DOMAIN_STYLES: Record<string, any> = {
  python: adventurer,
  sql: notionists,
  'ai-engineering': bottts, // robots for AI
  'data-science': micah,
  'web-dev': pixelArt,
  default: avataaars,
}

// Style for NPCs (quest-givers, mentors)
const NPC_STYLES: Record<string, any> = {
  'quest-giver': lorelei,
  mentor: personas,
  sage: miniavs,
  default: avataaars,
}

interface AvatarProps {
  seed: string
  domain?: string
  size?: number
  className?: string
  style?: 'agent' | 'npc' | 'quest-giver'
  backgroundColor?: string[]
}

export function Avatar({
  seed,
  domain,
  size = 40,
  className = '',
  style = 'agent',
  backgroundColor,
}: AvatarProps) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    const generate = async () => {
      let avatarStyle
      if (style === 'npc' || style === 'quest-giver') {
        avatarStyle = NPC_STYLES[style] || NPC_STYLES.default
      } else {
        avatarStyle = DOMAIN_STYLES[domain || ''] || DOMAIN_STYLES.default
      }

      const avatar = createAvatar(avatarStyle, {
        seed,
        backgroundColor: backgroundColor || ['10b981', '3b82f6', 'a855f7', 'f59e0b', 'ef4444'],
        radius: 50,
      })

      const dataUri = await avatar.toDataUri()
      if (!cancelled) setSvg(dataUri)
    }
    generate()
    return () => { cancelled = true }
  }, [seed, domain, style, backgroundColor?.join(',')])

  return (
    <div
      className={`rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {svg ? (
        <img src={svg} alt={seed} width={size} height={size} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full animate-pulse bg-zinc-700" />
      )}
    </div>
  )
}

// Helper to generate a DiceBear PNG data URL (used by Phaser for textures)
export async function generateAvatarPng(seed: string, domain?: string, size = 64): Promise<string> {
  let avatarStyle
  if (domain && DOMAIN_STYLES[domain]) {
    avatarStyle = DOMAIN_STYLES[domain]
  } else {
    avatarStyle = DOMAIN_STYLES.default
  }
  const avatar = createAvatar(avatarStyle, {
    seed,
    backgroundColor: ['10b981', '3b82f6', 'a855f7', 'f59e0b'],
    size,
    radius: 50,
  })
  return avatar.toPng()
}

// Helper to generate SVG string (for Phaser textures)
export async function generateAvatarSvg(seed: string, domain?: string): Promise<string> {
  let avatarStyle
  if (domain && DOMAIN_STYLES[domain]) {
    avatarStyle = DOMAIN_STYLES[domain]
  } else {
    avatarStyle = DOMAIN_STYLES.default
  }
  const avatar = createAvatar(avatarStyle, {
    seed,
    backgroundColor: ['10b981', '3b82f6', 'a855f7', 'f59e0b'],
    radius: 50,
  })
  return avatar.toString()
}
