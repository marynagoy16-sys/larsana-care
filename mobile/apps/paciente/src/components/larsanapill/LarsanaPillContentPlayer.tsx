import { Linking, Platform, Text, View } from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Button } from '@/components/ui/Button'
import { parseExerciseSteps } from '@/services/larsanapill'
import type { LarsanaPillContent } from '@/types/content'

interface LarsanaPillContentPlayerProps {
  content: LarsanaPillContent
  completing?: boolean
  onComplete: () => void
  preview?: boolean
}

export function LarsanaPillContentPlayer({
  content,
  completing,
  onComplete,
  preview = false,
}: LarsanaPillContentPlayerProps) {
  const exerciseSteps = content.content_type === 'exercise_steps' ? parseExerciseSteps(content.metadata) : []

  return (
    <View className="gap-4">
      {content.content_type === 'video' && content.storage_path ? (
        <View className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
          {Platform.OS === 'web' ? (
            <Text
              className="p-4 text-primary underline"
              onPress={() => void Linking.openURL(content.storage_path!)}
            >
              Abrir vídeo
            </Text>
          ) : (
            <Video
              source={{ uri: content.storage_path }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              style={{ width: '100%', height: 220 }}
            />
          )}
        </View>
      ) : null}

      {(content.content_type === 'pdf' || content.content_type === 'ebook') && content.storage_path ? (
        <Button variant="outline" onPress={() => void Linking.openURL(content.storage_path!)}>
          Abrir documento
        </Button>
      ) : null}

      {content.content_type === 'richtext' && content.content ? (
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="text-sm leading-6 text-foreground">{content.content.replace(/<[^>]+>/g, ' ')}</Text>
        </View>
      ) : null}

      {content.content_type === 'exercise_steps' && exerciseSteps.length > 0 ? (
        <View className="gap-3">
          {exerciseSteps.map((step, index) => (
            <View key={index} className="rounded-xl border border-border bg-card p-4">
              <Text className="font-medium text-foreground">{step.title}</Text>
              <Text className="mt-1 text-sm text-muted-foreground">{step.instruction}</Text>
              <Text className="mt-2 text-xs text-muted-foreground">{step.durationSeconds}s</Text>
            </View>
          ))}
        </View>
      ) : null}

      {!preview && content.content_type !== 'exercise_steps' ? (
        <Button onPress={onComplete} loading={completing}>
          Marcar como concluído
        </Button>
      ) : null}
    </View>
  )
}
