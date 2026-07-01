import { Pressable, Text, View } from 'react-native'
import { PlayCircle } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface ContentProgressBannerProps {
  title: string
  subtitle?: string
  completed: number
  total: number
  continueLabel?: string
  onContinue?: () => void
}

export function ContentProgressBanner({
  title,
  subtitle,
  completed,
  total,
  continueLabel = 'Continuar de onde parou',
  onContinue,
}: ContentProgressBannerProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const showContinue = Boolean(onContinue && completed < total)

  return (
    <View className="gap-4 rounded-2xl border border-border bg-muted/20 p-4">
      <View className="gap-1">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-sm text-muted-foreground">{subtitle}</Text> : null}
        <Text className="text-sm text-muted-foreground">
          {completed}/{total} concluídos · {percent}%
        </Text>
      </View>
      <ProgressBar value={percent} />
      {showContinue ? (
        <Button onPress={onContinue}>
          <View className="flex-row items-center gap-2">
            <PlayCircle size={16} color="#fff" />
            <Text className="font-semibold text-primary-foreground">{continueLabel}</Text>
          </View>
        </Button>
      ) : null}
    </View>
  )
}
