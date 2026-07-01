import { Text, View } from 'react-native'

interface LogoProps {
  subtitle?: string
}

export function Logo({ subtitle = 'Fisioterapia Domiciliar' }: LogoProps) {
  return (
    <View className="items-start">
      <Text className="font-display text-2xl font-bold text-primary">LarsanaCare</Text>
      {subtitle ? (
        <Text className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}
