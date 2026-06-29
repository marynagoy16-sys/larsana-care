import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { KpiCard } from '@/components/ui/KpiCard'

export default function AjudaScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
        <View className="flex-row flex-wrap gap-2">
          <KpiCard label="Total" value="0" icon={SquareStack} description="Ajuda" />
          <KpiCard label="Registros" value="0" icon={FileStack} description="Sem filtro aplicado" />
          <KpiCard label="Nesta página" value="0" icon={List} description="Nenhum registro" />
          <KpiCard label="Páginas" value="1" icon={Layers} description="—" />
        </View>
        <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
          <Text className="text-center text-sm text-muted-foreground">Central de ajuda em breve.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
