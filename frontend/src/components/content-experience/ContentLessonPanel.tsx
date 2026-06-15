import type { ReactNode } from 'react'

interface ContentLessonPanelProps {
  title: string
  description?: string | null
  children: ReactNode
}

export function ContentLessonPanel({ title, description, children }: ContentLessonPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold md:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}
