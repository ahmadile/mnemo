'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Suppress the React 19 false-positive warning about <script> tags
// injected by next-themes to prevent FOUC (Flash of Unstyled Content).
// This is a known compatibility issue: https://github.com/pacocoursey/next-themes/issues/169
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const origConsoleError = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag')
    ) {
      return
    }
    origConsoleError.apply(console, args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
