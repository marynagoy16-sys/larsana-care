import '../global.css'
import { useEffect } from 'react'
import { Slot, SplashScreen } from 'expo-router'
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { StatusBar } from 'expo-status-bar'
import { AppProviders } from '@/providers/AppProviders'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans: DMSans_400Regular,
    DMSans_500: DMSans_500Medium,
    DMSans_700: DMSans_700Bold,
    Inter: Inter_400Regular,
    Inter_500: Inter_500Medium,
    Inter_600: Inter_600SemiBold,
    Inter_700: Inter_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Slot />
    </AppProviders>
  )
}
