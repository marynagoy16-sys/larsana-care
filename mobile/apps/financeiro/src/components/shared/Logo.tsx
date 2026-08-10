import { Image, Text, View, type ImageSourcePropType } from 'react-native'

const brandImages = {
  logoDarkFull: require('../../../assets/brand/logo-dark-full.png') as ImageSourcePropType,
  logoLightFull: require('../../../assets/brand/logo-light-full.png') as ImageSourcePropType,
  markWhiteOnDark: require('../../../assets/brand/mark-white-on-dark.png') as ImageSourcePropType,
  markGreenOnLight: require('../../../assets/brand/mark-green-on-light.png') as ImageSourcePropType,
} as const

interface LogoProps {
  subtitle?: string
  variant?: 'light' | 'dark'
  full?: boolean
  markOnly?: boolean
}

export function Logo({
  subtitle = 'Fisioterapia Domiciliar',
  variant = 'light',
  full = false,
  markOnly = false,
}: LogoProps) {
  const onDark = variant === 'dark'
  const mark = onDark ? brandImages.markWhiteOnDark : brandImages.markGreenOnLight
  const fullLogo = onDark ? brandImages.logoDarkFull : brandImages.logoLightFull

  if (full) {
    return (
      <View className="items-start">
        <Image source={fullLogo} accessibilityLabel="Larsana Care" className="h-16 w-48" resizeMode="contain" />
        {subtitle ? (
          <Text
            className={`mt-2 text-xs font-medium uppercase tracking-widest ${onDark ? 'text-white/70' : 'text-muted-foreground'}`}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    )
  }

  if (markOnly) {
    return <Image source={mark} accessibilityLabel="Larsana Care" className="size-10" resizeMode="contain" />
  }

  return (
    <View className="flex-row items-center gap-3">
      <Image source={mark} accessibilityLabel="Larsana Care" className="size-10" resizeMode="contain" />
      <View className="min-w-0 flex-1">
        <Text className={`font-display text-xl font-bold ${onDark ? 'text-white' : 'text-foreground'}`}>
          LarsanaCare
        </Text>
        {subtitle ? (
          <Text
            className={`text-xs font-medium uppercase tracking-widest ${onDark ? 'text-white/70' : 'text-muted-foreground'}`}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
