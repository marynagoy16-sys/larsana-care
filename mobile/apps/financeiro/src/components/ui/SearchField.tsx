import { TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'
import { cn } from '@/lib/cn'

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  className,
}: {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <View className={cn('relative', className)}>
      <View className="absolute left-3 top-3.5 z-10">
        <Search size={18} color="#5A7920" />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#5A7920"
        className="h-12 rounded-xl border border-border bg-card pl-10 pr-4 text-base text-foreground"
      />
    </View>
  )
}
