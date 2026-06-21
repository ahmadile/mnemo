'use client'

import { useEffect, useState } from 'react'
import { ActivityCalendar } from 'react-activity-calendar'
import { Card } from '@/components/ui/card'
import { Flame, TrendingUp } from 'lucide-react'
import { useTheme } from 'next-themes'

interface ActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface ActivityHeatmapProps {
  data: ActivityDay[]
  streak: number
}

export function ActivityHeatmap({ data, streak }: ActivityHeatmapProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme !== 'light'

  return (
    <Card className="p-5 border-zinc-800/60 bg-zinc-900/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Activité d'apprentissage</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {data.reduce((sum, d) => sum + d.count, 0)} actions cette année
            </p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{streak}</span>
            <span className="text-[10px] text-amber-400/70">jours</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <ActivityCalendar
          data={data}
          theme={{
            dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
          }}
          labels={{
            totalCount: '{{count}} actions en {{year}}',
            weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
          }}
          colorScheme={isDark ? 'dark' : 'light'}
          blockSize={12}
          blockMargin={3}
          fontSize={11}
          showWeekdayLabels
        />
      </div>
    </Card>
  )
}
