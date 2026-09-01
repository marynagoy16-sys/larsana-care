import { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { createNpsSurvey } from '@/services/nps'

const SCORES = Array.from({ length: 11 }, (_, index) => index)

export default function NpsScreen() {
  const { cicloId } = useLocalSearchParams<{ cicloId: string }>()
  const router = useRouter()
  const [score, setScore] = useState(10)
  const [comment, setComment] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      createNpsSurvey({
        cycle_id: cicloId!,
        score,
        comment,
      }),
    onSuccess: () => {
      Alert.alert('Obrigado!', 'Sua avaliação foi registrada.')
      router.replace('/(app)/(tabs)/inicio')
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="text-lg font-semibold">Avalie o atendimento</Text>
        </View>
      </PageHeader>
      <View className="flex-1 px-4 py-6 gap-4">
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Nota (0–10)</Text>
          <View className="flex-row flex-wrap gap-2">
            {SCORES.map((value) => {
              const selected = score === value
              return (
                <Pressable
                  key={value}
                  onPress={() => setScore(value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Nota ${value}`}
                  accessibilityState={{ selected }}
                  className={cn(
                    'h-11 w-[15%] min-w-[2.75rem] items-center justify-center rounded-xl border',
                    selected ? 'border-primary bg-primary' : 'border-border bg-card',
                  )}
                >
                  <Text className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-foreground')}>
                    {value}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
        <Text className="text-sm text-muted-foreground">Comentário (opcional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          className="min-h-[100px] rounded-xl bg-muted px-4 py-3 text-base"
        />
        <Button onPress={() => submit.mutate()} loading={submit.isPending}>
          Enviar avaliação
        </Button>
      </View>
    </SafeAreaView>
  )
}
