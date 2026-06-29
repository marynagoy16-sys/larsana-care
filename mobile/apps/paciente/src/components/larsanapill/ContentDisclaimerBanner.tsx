import type { ReactNode } from 'react'
import { Text } from 'react-native'
import { Card } from '@/components/ui/Card'

export function ContentDisclaimerBanner({ children }: { children: ReactNode }) {
  return (
    <Card className="border-primary/30 bg-muted/50 p-4">
      <Text className="text-sm leading-5 text-foreground">{children}</Text>
    </Card>
  )
}
