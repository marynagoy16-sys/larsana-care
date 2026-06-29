import { Text, View } from 'react-native'
import { PlayCircle } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { LarsanaPillContentPlayer } from '@/components/larsanapill/LarsanaPillContentPlayer'
import type { LarsanaPillContent } from '@/types/content'

interface WeeklyPlanVslSectionProps {
  content: LarsanaPillContent | null
  planTitle: string
}

export function WeeklyPlanVslSection({ content, planTitle }: WeeklyPlanVslSectionProps) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-primary">Apresentação</Text>
        <Text className="text-xl font-semibold text-foreground">Veja como funciona o {planTitle}</Text>
        <Text className="text-sm text-muted-foreground">
          Assista à demonstração e conheça o formato dos exercícios guiados antes de começar.
        </Text>
      </View>

      {content ? (
        <Card className="overflow-hidden p-0">
          <View className="p-4">
            <LarsanaPillContentPlayer content={content} onComplete={() => undefined} preview />
          </View>
        </Card>
      ) : (
        <Card className="border-dashed">
          <View className="items-center gap-3 p-8">
            <PlayCircle size={40} color="#5A7920" />
            <Text className="text-center text-sm text-muted-foreground">
              A demonstração em vídeo deste plano será disponibilizada em breve. Enquanto isso, explore a rotina
              semanal abaixo.
            </Text>
          </View>
        </Card>
      )}
    </View>
  )
}
