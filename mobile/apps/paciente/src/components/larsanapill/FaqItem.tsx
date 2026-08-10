import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      <Pressable
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-start justify-between gap-3 p-4"
      >
        <Text className="flex-1 font-medium text-foreground">{question}</Text>
        <ChevronDown size={16} color="#49796B" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open ? (
        <View className="border-t border-border px-4 pb-4 pt-3">
          <Text className="text-sm leading-5 text-muted-foreground">{answer}</Text>
        </View>
      ) : null}
    </Card>
  )
}
