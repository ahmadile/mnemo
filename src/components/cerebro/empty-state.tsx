'use client'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <Card className={`p-8 border-dashed border-zinc-700 bg-zinc-900/20 text-center backdrop-blur-xl ${className}`}>
      <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 text-emerald-400">
        {icon}
      </div>
      <h3 className="font-bold text-zinc-200 mb-2">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-md mx-auto mb-4 leading-relaxed">
        {description}
      </p>
      {action}
    </Card>
  )
}

import { Card } from '@/components/ui/card'
