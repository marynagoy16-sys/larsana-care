import { Pressable, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getContentIcon } from '@/lib/content/contentIcons'
import type { AcademyContentType } from '@/types/content'

interface ContentLessonCardProps {
  title: string
  subtitle?: string | null
  badgeLabel?: string
  contentType?: AcademyContentType
  progressPercent?: number
  onPress: () => void
  icon?: LucideIcon
}

export function ContentLessonCard({
  title,
  subtitle,
  badgeLabel,
  contentType,
  progressPercent = 0,
  onPress,
  icon,
}: ContentLessonCardProps) {
  const Icon = icon ?? (contentType ? getContentIcon(contentType) : getContentIcon('richtext'))

  return (
    <Pressable onPress={onPress} className="w-[220px] shrink-0">
      <Card className="overflow-hidden">
        <View className="relative">
          {badgeLabel ? (
            <View className="absolute left-3 top-0 z-10 rounded-b-lg bg-primary px-3 py-1">
              <Text className="text-[11px] font-semibold text-primary-foreground">{badgeLabel}</Text>
            </View>
          ) : null}
          <View className="aspect-[4/3] items-center justify-center bg-muted/50">
            <Icon size={40} color="rgba(90,121,32,0.4)" />
          </View>
        </View>
        <View className="gap-3 p-4">
          <View className="gap-1">
            <Text className="text-sm font-semibold leading-snug text-foreground" numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {progressPercent > 0 ? (
            <View className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-[10px] text-muted-foreground">Progresso</Text>
                <Text className="text-[10px] text-muted-foreground">{Math.round(progressPercent)}%</Text>
              </View>
              <ProgressBar value={progressPercent} className="h-1.5" />
            </View>
          ) : null}
          <Button variant="outline" className="h-10" onPress={onPress}>
            Abrir
          </Button>
        </View>
      </Card>
    </Pressable>
  )
}
