import type { ReactNode } from 'react'
import { CONTENT_HUB_SCROLL_CLASS } from '@/lib/content/contentMeta'
import { cn } from '@/lib/utils'

interface ContentHubLayoutProps {
  children: ReactNode
  className?: string
}

export function ContentHubLayout({ children, className }: ContentHubLayoutProps) {
  return <div className={cn(CONTENT_HUB_SCROLL_CLASS, className)}>{children}</div>
}
