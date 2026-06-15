import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CONTENT_HUB_SECTION_PADDING } from '@/lib/content/contentMeta'
import { cn } from '@/lib/utils'

interface ContentDisclaimerBannerProps {
  children: ReactNode
  className?: string
  padded?: boolean
}

export function ContentDisclaimerBanner({ children, className, padded = false }: ContentDisclaimerBannerProps) {
  return (
    <div className={cn(padded && CONTENT_HUB_SECTION_PADDING, className)}>
      <Card className="border-primary/30 bg-muted/50">
        <CardContent className="p-4 text-sm">{children}</CardContent>
      </Card>
    </div>
  )
}
